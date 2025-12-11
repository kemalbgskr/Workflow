import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { docusealService } from "./docuseal";
import { insertProjectSchema, insertCommentSchema, insertUserSchema, insertProjectRequestSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import passport from "passport";
import express from "express";
import fs from "fs";

const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));
  // RBAC middleware
  const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      next();
    };
  };

  // Auth API
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Session destruction failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Projects API
  app.get("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      const projects = await storage.getProjectsForUser(userId, userRole);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/with-owner", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      const projects = await storage.getProjectsWithOwnerForUser(userId, userRole);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch projects with owner" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectRequestSchema.parse(req.body);
      
      // Use authenticated user as owner
      const ownerId = (req.user as any)?.id;
      
      if (!ownerId) {
        return res.status(500).json({ error: "No users found" });
      }
      
      const project = await storage.insertProject({ ...data, ownerId });
      res.status(201).json(project);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create project" });
      }
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const data = insertProjectSchema.partial().parse(req.body);
      
      // Get current project to track status change
      const currentProject = await storage.getProjectById(req.params.id);
      if (!currentProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const project = await storage.updateProject(req.params.id, data);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Log status change if status was updated
      if (data.status && currentProject.status !== data.status) {
        const userId = (req.user as any).id;
        await storage.insertAuditLog({
          actorId: userId,
          action: "Status Updated",
          targetType: "project",
          targetId: req.params.id,
          metadata: JSON.stringify({ from: currentProject.status, to: data.status })
        });
      }
      
      res.json(project);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update project", details: error.message });
      }
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const project = await storage.getProjectById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      
      // Check if user has access to this project
      const hasAccess = await storage.checkProjectAccess(req.params.id, userId, userRole);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(project);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: "Failed to fetch project", details: error.message });
    }
  });

  app.get("/api/projects/:id/history", async (req, res) => {
    try {
      const logs = await storage.getProjectAuditLogs(req.params.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch project history" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.patch("/api/projects/:id/status", requireRole(['ADMIN', 'REQUESTER']), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      // Get current project to track status change
      const currentProject = await storage.getProjectById(req.params.id);
      if (!currentProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Check if approvers are configured
      const approvers = await storage.getProjectApprovers(req.params.id);
      
      if (approvers.length > 0) {
        // Create status change approval request
        const userId = (req.user as any).id;
        const requestId = await storage.createStatusChangeRequest(
          req.params.id, 
          currentProject.status, 
          status, 
          userId
        );
        
        res.json({ 
          success: true, 
          message: "Status change request sent for approval",
          requiresApproval: true,
          requestId
        });
      } else {
        // No approvers configured, update directly
        const project = await storage.updateProject(req.params.id, { status });
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }
        
        // Log status change
        if (currentProject.status !== status) {
          const userId = (req.user as any).id;
          await storage.insertAuditLog({
            actorId: userId,
            action: "Status Updated",
            targetType: "project",
            targetId: req.params.id,
            metadata: JSON.stringify({ from: currentProject.status, to: status })
          });
        }
        
        res.json(project);
      }
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update project status" });
    }
  });

  app.get("/api/projects/:id/status-request", async (req, res) => {
    try {
      const request = await storage.getProjectStatusRequest(req.params.id);
      res.json(request || null);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch status request" });
    }
  });

  app.put("/api/projects/:id/archive", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, { status: "Archived" });
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to archive project" });
    }
  });

  app.post("/api/projects/:id/duplicate", async (req, res) => {
    try {
      const originalProject = await storage.getProjectById(req.params.id);
      if (!originalProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      const { id, code, createdAt, updatedAt, ...newProjectData } = originalProject;

      const duplicatedProject = await storage.insertProject({
        ...newProjectData,
        title: `${originalProject.title} (Copy)`,
        status: "Initiative Submitted",
      });
      res.status(201).json(duplicatedProject);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to duplicate project" });
    }
  });

  // Approvals API
  app.get("/api/approvals", requireRole(['ADMIN', 'APPROVER']), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      console.log('Fetching document approvals for user:', userId, 'role:', userRole);
      
      // Admin can see all pending approvals, others only see their own
      const approvals = userRole === 'ADMIN' 
        ? await storage.getAllPendingApprovals()
        : await storage.getPendingApprovals(userId);
      
      console.log('Found document approvals:', approvals.length);
      res.json(approvals);
    } catch (error: any) {
      console.error('Error fetching document approvals:', error);
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  app.get("/api/approvals/completed", requireRole(['ADMIN', 'APPROVER']), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      
      // Admin can see all completed approvals, others only see their own
      const approvals = userRole === 'ADMIN'
        ? await storage.getAllCompletedApprovals()
        : await storage.getCompletedApprovals(userId);
      
      res.json(approvals);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch completed approvals" });
    }
  });

  app.get("/api/approvals/status-changes", requireRole(['ADMIN', 'APPROVER']), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const userRole = (req.user as any).role;
      const approvals = userRole === 'ADMIN'
        ? await storage.getAllPendingStatusApprovals()
        : await storage.getPendingStatusApprovals(userId);
      
      res.json(approvals);
    } catch (error: any) {
      console.error('Error fetching status approvals:', error);
      res.status(500).json({ error: "Failed to fetch status change approvals" });
    }
  });

  app.post("/api/approvals/status-changes/:id/approve", requireRole(['ADMIN', 'APPROVER']), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { comment } = req.body;
      await storage.approveStatusChange(req.params.id, userId, comment || '');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to approve status change" });
    }
  });

  app.post("/api/approvals/status-changes/:id/reject", requireRole(['ADMIN', 'APPROVER']), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { comment } = req.body;
      await storage.rejectStatusChange(req.params.id, userId, comment || '');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to reject status change" });
    }
  });

  app.post("/api/approvals/:id/approve", requireRole(['ADMIN', 'APPROVER']), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const userId = (req.user as any).id;
      const { comment } = req.body;
      
      // Get document info before approval for logging
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      await storage.approveDocument(req.params.id, userId);
      
      // Get user info for audit log
      const user = await storage.getUserById(userId);
      
      // Additional audit log for project history
      await storage.insertAuditLog({
        actorId: userId,
        action: "Document Approved",
        targetType: "project",
        targetId: document.projectId,
        metadata: JSON.stringify({
          documentName: document.filename,
          documentType: document.type,
          lifecycleStep: document.lifecycleStep,
          documentId: document.id,
          approverName: user?.name || 'Unknown',
          comment: comment || ''
        })
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to approve document" });
    }
  });

  app.post("/api/approvals/:id/decline", requireRole(['ADMIN', 'APPROVER']), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const userId = (req.user as any).id;
      const { comment } = req.body;
      
      // Get document info before rejection for logging
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      await storage.rejectDocument(req.params.id, userId);
      
      // Get user info for audit log
      const user = await storage.getUserById(userId);
      
      // Additional audit log for project history
      await storage.insertAuditLog({
        actorId: userId,
        action: "Document Rejected",
        targetType: "project",
        targetId: document.projectId,
        metadata: JSON.stringify({
          documentName: document.filename,
          documentType: document.type,
          lifecycleStep: document.lifecycleStep,
          documentId: document.id,
          approverName: user?.name || 'Unknown',
          comment: comment || ''
        })
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to decline document" });
    }
  });

  // Comments API
  app.get("/api/projects/:id/comments", async (req, res) => {
    try {
      console.log('Fetching comments for project:', req.params.id);
      const comments = await storage.getProjectComments(req.params.id);
      console.log('Found comments:', comments.length);
      res.setHeader('Content-Type', 'application/json');
      res.json(comments || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/projects/:id/comments", upload.single("attachment"), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {

      
      const { body } = req.body;
      const file = req.file;
      
      if (!body || body.trim() === '') {
        return res.status(400).json({ error: "Comment body is required" });
      }
      
      const commentData = {
        projectId: req.params.id,
        authorId: (req.user as any).id,
        body: body.trim(),
        attachmentPath: file ? file.path : null,
        attachmentName: file ? file.originalname : null
      };
      
      const comment = await storage.insertProjectComment(commentData);

      
      // Log comment creation
      const commentPreview = body.trim().substring(0, 100);

      
      await storage.insertAuditLog({
        actorId: (req.user as any).id,
        action: "Comment Added",
        targetType: "project",
        targetId: req.params.id,
        metadata: JSON.stringify({ 
          commentId: comment.id,
          commentPreview: commentPreview,
          hasAttachment: !!file,
          attachmentName: file?.originalname
        })
      });
      
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(comment);
    } catch (error: any) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: "Failed to add comment", details: error.message });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    console.log('DELETE /api/comments/:id - Comment ID:', req.params.id);
    if (!req.isAuthenticated()) {
      console.log('User not authenticated');
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      console.log('Finding comment with ID:', req.params.id);
      const comment = await storage.getCommentById(req.params.id);
      if (!comment) {
        console.log('Comment not found:', req.params.id);
        return res.status(404).json({ error: "Comment not found" });
      }
      
      console.log('Found comment:', comment.body);
      
      // Delete physical file if exists
      if (comment.attachmentPath && fs.existsSync(comment.attachmentPath)) {
        console.log('Deleting attachment file:', comment.attachmentPath);
        fs.unlinkSync(comment.attachmentPath);
      }
      
      console.log('Deleting comment from database');
      
      // Log comment deletion
      const userId = (req.user as any).id;
      if (comment.projectId) {
        const commentPreview = comment.body ? comment.body.substring(0, 100) : '';
  
        
        await storage.insertAuditLog({
          actorId: userId,
          action: "Comment Deleted",
          targetType: "project",
          targetId: comment.projectId,
          metadata: JSON.stringify({ 
            commentId: comment.id,
            commentPreview,
            hadAttachment: !!comment.attachmentPath,
            attachmentName: comment.attachmentName
          })
        });
      }
      
      await storage.deleteComment(req.params.id);
      console.log('Comment deleted successfully');
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  app.get("/api/comments/:id/attachment", async (req, res) => {
    try {
      const comment = await storage.getCommentById(req.params.id);
      if (!comment || !comment.attachmentPath) {
        return res.status(404).json({ error: "Attachment not found" });
      }
      
      const { view } = req.query;
      if (view === 'true') {
        // Serve file for viewing with proper headers
        const fileName = comment.attachmentName || 'attachment';
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'pdf') {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline');
          res.setHeader('Cache-Control', 'no-cache');
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
          res.setHeader('Content-Type', `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`);
          res.setHeader('Content-Disposition', 'inline');
        }
        
        res.sendFile(comment.attachmentPath, { root: process.cwd() });
      } else {
        // Download file
        res.download(comment.attachmentPath, comment.attachmentName || 'attachment');
      }
    } catch (error: any) {
      res.status(500).json({ error: "Failed to serve attachment" });
    }
  });

  app.post("/api/documents/:id/comments", async (req, res) => {
    try {
      const data = insertCommentSchema.parse({
        ...req.body,
        documentId: req.params.id
      });
      const comment = await storage.insertComment(data);
      res.status(201).json(comment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to add comment" });
      }
    }
  });

  // Dashboard Stats API
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      const userId = req.isAuthenticated() ? (req.user as any).id : undefined;
      
      let approvals = [];
      try {
        approvals = await storage.getPendingApprovals(userId);
      } catch (approvalError) {
        console.error('Error fetching pending approvals:', approvalError);
        approvals = [];
      }
      
      const stats = {
        myRequests: projects.filter(p => p.ownerId === userId).length,
        pendingApprovals: approvals.length,
        activeProjects: projects.filter(p => !['Go Live', 'PTR'].includes(p.status)).length,
        completed: projects.filter(p => ['Go Live', 'PTR'].includes(p.status)).length
      };
      
      res.json(stats);
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: "Failed to fetch dashboard stats", details: error.message });
    }
  });

  // Documents API
  app.get("/api/documents", async (req, res) => {
    try {
      console.log('GET /api/documents - Query:', req.query);
      const { projectId } = req.query;
      const documents = await storage.getDocuments(projectId as string);
      console.log('Documents fetched:', documents.length, 'documents');
      res.json(documents);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload", requireRole(['ADMIN', 'REQUESTER']), upload.single("file"), async (req, res) => {
    console.log("Upload request body:", req.body);
    console.log("Upload request file:", req.file);

    try {
      const { projectId, lifecycleStep, documentType } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const userId = (req.user as any).id;
      
      const { priority = "MEDIUM" } = req.body;
      
      const document = await storage.insertDocument({
        projectId,
        lifecycleStep,
        filename: file.originalname,
        storageKey: file.path,
        type: documentType || file.mimetype,
        priority,
        createdById: userId,
      });
      
      // Log document upload for document-level tracking
      await storage.insertAuditLog({
        actorId: userId,
        action: "Document Uploaded",
        targetType: "document",
        targetId: document.id,
        metadata: JSON.stringify({ 
          filename: file.originalname, 
          type: documentType || file.mimetype,
          lifecycleStep,
          size: file.size
        })
      });
      
      // Log document upload for project-level tracking
      await storage.insertAuditLog({
        actorId: userId,
        action: "Document Uploaded",
        targetType: "project",
        targetId: projectId,
        metadata: JSON.stringify({ 
          filename: file.originalname, 
          type: documentType || file.mimetype,
          lifecycleStep,
          documentId: document.id
        })
      });

      res.status(201).json(document);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });


  app.post("/api/documents/:id/docuseal-token", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const document = await storage.getDocumentById(req.params.id);
      if (!document) return res.status(404).json({ error: "Document not found" });

      // Read file content and convert to base64
      // storageKey is the relative path in uploads folder, usually handled by storage implementation
      // But assuming direct fs access for now or `storage.ts` has helper?
      // `storage` is typically the db interface. `multer` saves files.
      // Let's assume `document.storageKey` gives the path.
      
      const fs = await import('fs');
      const path = await import('path');
      
      // Usually uploads are in `uploads/` or cwd?
      // Check `storageKey` usage in other routes.
      // Existing routes use `res.sendFile(path.resolve(doc.storageKey))`
      
      const filePath = path.resolve(document.storageKey);
      if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: "File not found on server" });
      }
      
      const fileBuffer = fs.readFileSync(filePath);
      const fileBase64 = fileBuffer.toString('base64');
      
      // Generate Token
      const token = await docusealService.getBuilderToken({
        user_email: (req.user as any).email || `user_${(req.user as any).id}@example.com`,
        name: document.filename,
        document_urls: [], // We use base64 in the documents field internally if we could, 
                           // BUT getBuilderToken just signs the payload. 
                           // We need to pass the base64 in the payload.
        // I need to update getBuilderToken to put documents in payload properly?
        // The user snippet had `document_urls`. 
        // DocuSeal builder also supports `documents` array with base64.
      });
      
      // Wait, passing 10MB base64 in a JWT token URL param might be too large!
      // JWTs in URL params have limits.
      // If the file is large, we MUST use a URL.
      // If `localhost` works for the browser (because builder fetches from browser), then we can use `http://localhost:5000/api/documents/:id/download`.
      // Let's try URL approach first! It's much cleaner.
      
      // Construct download URL
      // We need the APP_URL.
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const downloadUrl = `${appUrl}/api/documents/${document.id}/download`;
      
      const urlToken = await docusealService.getBuilderToken({
        user_email: (req.user as any).email || `user_${(req.user as any).id}@example.com`,
        name: document.filename,
        document_urls: [downloadUrl]
      });
      
      res.json({ token: urlToken });
      
    } catch (error: any) {
      console.error("Builder Token Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/documents/:id/approvers", async (req, res) => {

    if (!req.isAuthenticated()) {

      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = req.params.id;
      const { 
        approvers: approverIds, 
        useDocuSeal = false, 
        approvalMode = "SEQUENTIAL",
        priority = "MEDIUM",
        approvalSteps = []
      } = req.body;



      // Enhanced input validation
      if (!id || typeof id !== 'string') {

        return res.status(400).json({ error: "Valid document ID is required" });
      }

      if (!approverIds) {

        return res.status(400).json({ error: "Approvers field is required" });
      }

      if (!Array.isArray(approverIds)) {

        return res.status(400).json({ error: "Approvers must be an array" });
      }

      if (approverIds.length === 0) {

        return res.status(400).json({ error: "At least one approver is required" });
      }

      // Validate each approver ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (let i = 0; i < approverIds.length; i++) {
        const approverId = approverIds[i];
        if (!approverId || typeof approverId !== 'string') {
          return res.status(400).json({ error: `Invalid approver ID at position ${i + 1}` });
        }
        if (!uuidRegex.test(approverId)) {
          return res.status(400).json({ error: `Approver ID at position ${i + 1} is not a valid UUID: ${approverId}` });
        }
      }

      const userId = (req.user as any).id;
      
      await storage.configureApprovers(id, approverIds, approvalMode, approvalSteps, userId, priority);

      // If DocuSeal is enabled, create signature envelope
      if (useDocuSeal) {
        const document = await storage.getDocumentById(id);
        
        if (!document) {
          return res.status(404).json({ error: "Document not found" });
        }
        
        const approvers = await storage.getDocumentApprovers(id);
        
        if (approvers.length > 0) {
          const envelope = await storage.createDocuSealEnvelope(document, approvers);
          return res.json({ success: true, envelope, approvalMode });
        }
      }
      
      res.json({ success: true, approvalMode });
    } catch (error: any) {
      console.error("=== CONFIGURE APPROVERS ERROR ===");
      console.error("Error:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Request params:", { 
        documentId: req.params.id, 
        approverIds: req.body?.approvers, 
        approvalMode: req.body?.approvalMode, 
        approvalSteps: req.body?.approvalSteps,
        priority: req.body?.priority
      });
      console.error("User ID:", (req.user as any)?.id);
      console.error("================================");
      
      // Return appropriate error status based on error type
      if (error?.message?.includes('Document not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error?.message?.includes('Cannot modify approvers')) {
        return res.status(409).json({ error: error.message });
      }
      if (error?.message?.includes('Cannot change approval mode')) {
        return res.status(409).json({ error: error.message });
      }
      if (error?.message?.includes('No valid approver users found')) {
        return res.status(400).json({ error: error.message });
      }
      if (error?.message?.includes('At least one approver ID is required')) {
        return res.status(400).json({ error: error.message });
      }
      if (error?.message?.includes('Document ID is required')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to configure approvers", details: error?.message || 'Unknown error' });
    }
  });

  app.get("/api/documents/:id/view", async (req, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(document.storageKey, { root: process.cwd() });
    } catch (error: any) {
      console.error('View document error:', error);
      res.status(500).json({ error: "Failed to view document" });
    }
  });

  app.get("/api/documents/:id/download", async (req, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const filePath = document.storageKey;
      res.download(filePath, document.filename);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.get("/api/documents/:id/status", async (req, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const approvers = await storage.getDocumentApprovers(req.params.id);
      const approvalMode = await storage.getApprovalMode(req.params.id);
      const totalApprovers = approvers.length;
      const approvedCount = approvers.filter(a => a.status === "APPROVED").length;
      const rejectedCount = approvers.filter(a => a.status === "REJECTED").length;
      const pendingCount = approvers.filter(a => a.status === "PENDING").length;
      
      res.json({
        status: document.status,
        approvalMode,
        totalApprovers,
        approvedCount,
        rejectedCount,
        pendingCount,
        isComplete: pendingCount === 0,
        approvers
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch document status" });
    }
  });

  app.post("/api/documents/:id/check-completion", async (req, res) => {
    try {
      const documentId = req.params.id;
      console.log(`Checking completion for document: ${documentId}`);
      
      const approvers = await storage.getDocumentApprovers(documentId);
      console.log(`Found ${approvers.length} approvers:`, approvers.map(a => ({ email: a.email, status: a.status })));
      
      if (approvers.length === 0) {
        return res.json({ message: "No approvers found" });
      }
      
      const pendingCount = approvers.filter(a => a.status === "PENDING").length;
      const approvedCount = approvers.filter(a => a.status === "APPROVED").length;
      const rejectedCount = approvers.filter(a => a.status === "REJECTED").length;
      
      console.log(`Status counts - Pending: ${pendingCount}, Approved: ${approvedCount}, Rejected: ${rejectedCount}`);
      
      if (pendingCount === 0) {
        const hasRejected = rejectedCount > 0;
        const allApproved = approvedCount === approvers.length;
        const newStatus = hasRejected ? "REJECTED" : allApproved ? "APPROVED" : "IN_REVIEW";
        
        console.log(`All approvers completed. Updating document status to: ${newStatus}`);
        
        await storage.forceUpdateDocumentStatus(documentId, newStatus);
        
        res.json({ 
          message: "Document status updated", 
          newStatus,
          approvedCount,
          rejectedCount,
          totalApprovers: approvers.length
        });
      } else {
        res.json({ 
          message: "Approval still pending", 
          pendingCount,
          approvedCount,
          rejectedCount
        });
      }
    } catch (error: any) {
      console.error("Error checking document completion:", error);
      res.status(500).json({ error: "Failed to check document completion" });
    }
  });

  app.get("/api/documents/:id/approvers", async (req, res) => {
    try {
      const approvers = await storage.getDocumentApprovers(req.params.id);
      res.json(approvers);
    } catch (error: any) {
      console.error('Error fetching document approvers:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: "Failed to fetch approvers", details: error.message });
    }
  });
  
  app.get("/api/documents/:id/approval-mode", async (req, res) => {
    try {
      const mode = await storage.getApprovalMode(req.params.id);
      res.json({ mode });
    } catch (error: any) {
      console.error('Error fetching approval mode:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: "Failed to fetch approval mode", details: error.message });
    }
  });

  app.post("/api/documents/:id/approve", requireRole(['ADMIN', 'APPROVER']), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { comment } = req.body;
      
      // Get document info before approval for logging
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      await storage.approveDocument(req.params.id, userId);
      
      // Additional audit log for project history
      await storage.insertAuditLog({
        actorId: userId,
        action: "Document Approved",
        targetType: "project",
        targetId: document.projectId,
        metadata: JSON.stringify({
          documentName: document.filename,
          documentType: document.type,
          lifecycleStep: document.lifecycleStep,
          documentId: document.id,
          comment: comment || ''
        })
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to approve document" });
    }
  });

  app.post("/api/documents/:id/reject", requireRole(['ADMIN', 'APPROVER']), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { comment } = req.body;
      
      // Get document info before rejection for logging
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      await storage.rejectDocument(req.params.id, userId);
      
      // Additional audit log for project history
      await storage.insertAuditLog({
        actorId: userId,
        action: "Document Rejected",
        targetType: "project",
        targetId: document.projectId,
        metadata: JSON.stringify({
          documentName: document.filename,
          documentType: document.type,
          lifecycleStep: document.lifecycleStep,
          documentId: document.id,
          comment: comment || ''
        })
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to reject document" });
    }
  });

  app.post("/api/documents/:id/send-for-signing", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const { envelopeId } = req.body;
      if (!envelopeId) {
        return res.status(400).json({ error: "Envelope ID is required" });
      }
      
      await storage.sendDocuSealForSigning(envelopeId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error sending document for signing:', error);
      res.status(500).json({ error: "Failed to send document for signing" });
    }
  });

  app.get("/api/documents/:id/signature-status", async (req, res) => {
    try {
      const signatureStatus = await storage.getSignatureStatus(req.params.id);
      if (!signatureStatus) {
        return res.status(404).json({ error: "Signature status not found" });
      }
      res.json(signatureStatus);
    } catch (error: any) {
      console.error('Error fetching signature status:', error);
      res.status(500).json({ error: "Failed to fetch signature status" });
    }
  });

  app.delete("/api/documents/:id", requireRole(['ADMIN']), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      console.log('DELETE /api/documents/:id - Document ID:', req.params.id);
      
      // Check if document exists first
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        console.log('Document not found:', req.params.id);
        return res.status(404).json({ error: "Document not found" });
      }
      
      console.log('Found document:', document.filename);
      
      // Log document deletion before deleting
      const userId = (req.user as any).id;
      
      // Log for document-level tracking
      await storage.insertAuditLog({
        actorId: userId,
        action: "Document Deleted",
        targetType: "document",
        targetId: document.id,
        metadata: JSON.stringify({ 
          filename: document.filename,
          type: document.type,
          lifecycleStep: document.lifecycleStep
        })
      });
      
      // Log for project-level tracking
      await storage.insertAuditLog({
        actorId: userId,
        action: "Document Deleted",
        targetType: "project",
        targetId: document.projectId,
        metadata: JSON.stringify({ 
          filename: document.filename,
          type: document.type,
          lifecycleStep: document.lifecycleStep,
          documentId: document.id
        })
      });
      
      await storage.deleteDocument(req.params.id);
      console.log('Document deleted successfully');
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: "Failed to delete document", details: error.message });
    }
  });

  // Users API
  app.get("/api/users", async (req, res) => {
    // Allow all authenticated users to see users for mentions, but filter sensitive data
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if ((req.user as any).role === 'ADMIN') {
      // Admin gets full user data
      const users = await storage.getUsers();
      res.json(users);
    } else {
      // Others get limited data for mentions only
      const users = await storage.getUsers();
      const limitedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }));
      res.json(limitedUsers);
    }
  });

  app.get("/api/users/admin", requireRole(['ADMIN']), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireRole(['ADMIN']), async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  app.put("/api/users/:id", requireRole(['ADMIN']), async (req, res) => {
    try {
      const data = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  });

  app.delete("/api/users/:id", requireRole(['ADMIN']), async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // DocuSeal webhook endpoint
  app.post("/api/webhooks/docuseal", async (req, res) => {
    try {
      const signature = req.headers['x-docuseal-signature'] as string;
      const payload = JSON.stringify(req.body);
      
      // Verify webhook signature (optional but recommended)
      // if (!docusealService.verifyWebhookSignature(payload, signature)) {
      //   return res.status(401).json({ error: "Invalid signature" });
      // }
      
      await storage.processDocuSealWebhook(req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error("DocuSeal webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Project approval endpoints
  app.get("/api/projects/:id/approvers", async (req, res) => {
    try {
      console.log('GET /api/projects/:id/approvers - Project ID:', req.params.id);
      const approvers = await storage.getProjectApprovers(req.params.id);
      console.log('Retrieved approvers:', approvers.length);
      res.json(approvers);
    } catch (error: any) {
      console.error('Error fetching project approvers:', error);
      res.status(500).json({ error: "Failed to fetch project approvers" });
    }
  });

  app.post("/api/projects/:id/approvers", async (req, res) => {
    console.log('=== POST /api/projects/:id/approvers CALLED ===');
    console.log('Project ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const { approverIds, mode = "SEQUENTIAL", priority = "MEDIUM" } = req.body;
      console.log('Parsed data:', { approverIds, mode, priority });
      
      if (!approverIds || !Array.isArray(approverIds)) {
        console.log('Invalid approverIds:', approverIds);
        return res.status(400).json({ error: "Approver IDs are required" });
      }
      
      console.log('Calling storage.configureProjectApprovers...');
      await storage.configureProjectApprovers(req.params.id, approverIds, mode, priority);
      console.log('Success!');
      res.json({ success: true });
    } catch (error: any) {
      console.error('=== CONFIGURE PROJECT APPROVERS ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      res.status(500).json({ error: "Failed to configure project approvers", details: error?.message });
    }
  });

  app.get("/api/projects/:id/approval-status", async (req, res) => {
    try {
      const status = await storage.getProjectApprovalStatus(req.params.id);
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch approval status" });
    }
  });

  app.delete("/api/projects/:projectId/approvers/:approverId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      console.log('DELETE approver:', req.params.approverId, 'from project:', req.params.projectId);
      await storage.deleteProjectApprover(req.params.projectId, req.params.approverId);
      console.log('Approver deleted successfully');
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting project approver:', error);
      res.status(500).json({ error: "Failed to delete approver", details: error?.message });
    }
  });

  // Get approver lifecycle status
  app.get("/api/approvers/:approverId/lifecycle", async (req, res) => {
    try {
      const { approverId } = req.params;
      const { projectId } = req.query;
      
      const lifecycle = await storage.getApproverLifecycle(approverId, projectId as string);
      res.json(lifecycle);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch approver lifecycle" });
    }
  });

  // Test database connection
  app.get("/api/test-db", async (req, res) => {
    try {
      console.log('Testing database connection...');
      const users = await storage.getUsers();
      console.log('Database test successful, found users:', users.length);
      res.json({ success: true, message: "Database connection OK", userCount: users.length });
    } catch (error: any) {
      console.error('Database test failed:', error);
      res.status(500).json({ error: "Database connection failed", details: error.message });
    }
  });

  // Clear all data endpoint
  app.post("/api/clear-all", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      for (const project of projects) {
        await storage.deleteProject(project.id);
      }
      res.json({ success: true, message: "All data cleared" });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to clear data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
