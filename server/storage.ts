import { eq, desc, and, inArray, sql } from "drizzle-orm";
import fs from "fs";
import { db } from "./db";
import { docusealService } from "./docuseal";
import {
  users,
  projects,
  documents,
  comments,
  approvers,
  approvalRounds,
  auditLogs,
  signatureEnvelopes,
  projectStatusRequests,
  projectApprovers,
  projectStatusApprovals,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Comment,
  type InsertComment,
  type Document,
  type InsertDocument,
  type AuditLog,
  type SignatureEnvelope,
  type ProjectStatusRequest,
  type ProjectApprover,
  type ProjectStatusApproval,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getUsers(): Promise<User[]>;

  getProjects(): Promise<Project[]>;
  getProjectsForUser(userId: string, userRole: string): Promise<Project[]>;
  getProjectsWithOwner(): Promise<any[]>;
  getProjectsWithOwnerForUser(userId: string, userRole: string): Promise<any[]>;
  getProjectById(id: string): Promise<Project | undefined>;
  checkProjectAccess(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<boolean>;
  insertProject(project: Omit<InsertProject, "code">): Promise<Project>;
  updateProject(
    id: string,
    project: Partial<InsertProject>
  ): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;

  getDocuments(projectId?: string): Promise<any[]>;
  getDocumentById(id: string): Promise<Document | undefined>;
  insertDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  configureApprovers(
    documentId: string,
    approverIds: string[],
    approvalMode?: string,
    approvalSteps?: any[],
    actorId?: string,
    priority?: string
  ): Promise<void>;

  getPendingApprovals(userId?: string): Promise<any[]>;
  getCompletedApprovals(userId?: string): Promise<any[]>;
  getAllPendingApprovals(): Promise<any[]>;
  getAllCompletedApprovals(): Promise<any[]>;
  getAllPendingStatusApprovals(): Promise<any[]>;
  approveDocument(documentId: string, userId?: string): Promise<void>;
  rejectDocument(documentId: string, userId: string): Promise<void>;
  forceUpdateDocumentStatus(documentId: string, status: string): Promise<void>;

  insertComment(comment: InsertComment): Promise<Comment>;
  getProjectComments(projectId: string): Promise<any[]>;
  insertProjectComment(comment: any): Promise<any>;
  getCommentById(id: string): Promise<any>;
  deleteComment(id: string): Promise<void>;
  insertAuditLog(log: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: string;
  }): Promise<void>;
  getAuditLogs(targetType: string, targetId: string): Promise<AuditLog[]>;
  getProjectAuditLogs(projectId: string): Promise<any[]>;
  getDocumentApprovers(documentId: string): Promise<any[]>;
  getApprovalMode(documentId: string): Promise<string>;
  approveDocument(documentId: string, userId: string): Promise<void>;
  rejectDocument(documentId: string, userId: string): Promise<void>;
  createDocuSealEnvelope(
    document: Document,
    approvers: any[]
  ): Promise<SignatureEnvelope>;
  sendDocuSealForSigning(envelopeId: string): Promise<void>;
  getSignatureStatus(
    documentId: string
  ): Promise<SignatureEnvelope | undefined>;
  processDocuSealWebhook(payload: any): Promise<void>;

  // Project approval methods
  getProjectApprovers(projectId: string): Promise<any[]>;
  configureProjectApprovers(
    projectId: string,
    approverIds: string[],
    mode?: string,
    priority?: string
  ): Promise<void>;
  deleteProjectApprover(projectId: string, approverId: string): Promise<void>;
  getProjectApprovalStatus(projectId: string): Promise<any>;
  getPendingStatusApprovals(userId?: string): Promise<any[]>;
  getAllPendingStatusApprovals(): Promise<any[]>;
  approveStatusChange(
    requestId: string,
    userId: string,
    comment: string
  ): Promise<void>;
  rejectStatusChange(
    requestId: string,
    userId: string,
    comment: string
  ): Promise<void>;
  createStatusChangeRequest(
    projectId: string,
    fromStatus: string,
    toStatus: string,
    userId: string
  ): Promise<string>;
  getProjectStatusRequest(
    projectId: string
  ): Promise<ProjectStatusRequest | undefined>;
  getApproverLifecycle(approverId: string, projectId?: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getProjectStatusRequest(
    projectId: string
  ): Promise<ProjectStatusRequest | undefined> {
    try {
      const result = await db
        .select()
        .from(projectStatusRequests)
        .where(
          and(
            eq(projectStatusRequests.projectId, projectId),
            eq(projectStatusRequests.status, "PENDING")
          )
        )
        .orderBy(desc(projectStatusRequests.createdAt))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error("Error getting project status request:", error);
      return undefined;
    }
  }

  async createStatusChangeRequest(
    projectId: string,
    fromStatus: string,
    toStatus: string,
    userId: string
  ): Promise<string> {
    try {
      const [request] = await db
        .insert(projectStatusRequests)
        .values({
          projectId,
          fromStatus,
          toStatus,
          requestedBy: userId,
          status: "PENDING",
        })
        .returning();

      // Get user info for audit log
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Log status change request creation
      await this.insertAuditLog({
        actorId: userId,
        action: "Status Change Requested",
        targetType: "project",
        targetId: projectId,
        metadata: JSON.stringify({
          fromStatus,
          toStatus,
          requestedBy: user[0]?.name || "Unknown",
          requestId: request.id,
        }),
      });

      return request.id;
    } catch (error) {
      console.error("Error creating status change request:", error);
      throw error;
    }
  }

  async getPendingStatusApprovals(userId?: string): Promise<any[]> {
    if (!userId) return [];

    try {
      const userProjects = await db
        .select({
          projectId: projectApprovers.projectId,
          mode: projectApprovers.mode,
          orderIndex: projectApprovers.orderIndex,
        })
        .from(projectApprovers)
        .where(eq(projectApprovers.userId, userId));

      if (userProjects.length === 0) return [];

      const projectIds = userProjects.map((p) => p.projectId);

      const pendingRequests = await db
        .select({
          id: projectStatusRequests.id,
          projectId: projectStatusRequests.projectId,
          fromStatus: projectStatusRequests.fromStatus,
          toStatus: projectStatusRequests.toStatus,
          requestedBy: projectStatusRequests.requestedBy,
          createdAt: projectStatusRequests.createdAt,
          projectTitle: projects.title,
          projectCode: projects.code,
          projectType: projects.type,
          projectMethodology: projects.methodology,
          projectDescription: projects.description,
          requesterName: users.name,
          requesterEmail: users.email,
          requesterDepartment: users.department,
        })
        .from(projectStatusRequests)
        .leftJoin(projects, eq(projectStatusRequests.projectId, projects.id))
        .leftJoin(users, eq(projectStatusRequests.requestedBy, users.id))
        .where(
          and(
            inArray(projectStatusRequests.projectId, projectIds),
            eq(projectStatusRequests.status, "PENDING")
          )
        );

      return pendingRequests.map((request) => {
        const projectApprover = userProjects.find(
          (p) => p.projectId === request.projectId
        );
        const daysDiff = Math.floor(
          (new Date().getTime() -
            new Date(request.createdAt || new Date()).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const priority =
          daysDiff > 3 ? "High" : daysDiff > 1 ? "Medium" : "Low";

        return {
          id: request.id,
          type: "WORKFLOW_APPROVAL",
          projectId: request.projectId,
          projectTitle: request.projectTitle || "Unknown Project",
          projectCode: request.projectCode || "N/A",
          projectType: request.projectType,
          projectMethodology: request.projectMethodology,
          projectDescription: request.projectDescription,
          fromStatus: request.fromStatus,
          toStatus: request.toStatus,
          requester: {
            name: request.requesterName || "Unknown User",
            email: request.requesterEmail,
            department: request.requesterDepartment,
            initials: (request.requesterName || "UN")
              .split(" ")
              .map((n) => n[0])
              .join(""),
          },
          approvalMode: projectApprover?.mode || "SEQUENTIAL",
          orderIndex: projectApprover?.orderIndex || 0,
          priority,
          status: "PENDING",
          submittedAt: request.createdAt,
          dueDate:
            daysDiff === 0
              ? "Today"
              : daysDiff === 1
              ? "Tomorrow"
              : `${daysDiff} days ago`,
        };
      });
    } catch (error) {
      console.error("Error getting pending status approvals:", error);
      return [];
    }
  }

  async approveStatusChange(
    requestId: string,
    userId: string,
    comment: string
  ): Promise<void> {
    try {
      // Record the approval
      await db.insert(projectStatusApprovals).values({
        requestId,
        approverId: userId,
        status: "APPROVED",
        comment,
        approvedAt: new Date(),
      });

      // Get request and user info for audit log
      const request = await db
        .select()
        .from(projectStatusRequests)
        .where(eq(projectStatusRequests.id, requestId))
        .limit(1);

      if (request.length === 0) return;

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Log individual approval
      await this.insertAuditLog({
        actorId: userId,
        action: "Status Change Approved",
        targetType: "project",
        targetId: request[0].projectId,
        metadata: JSON.stringify({
          fromStatus: request[0].fromStatus,
          toStatus: request[0].toStatus,
          approverName: user[0]?.name || "Unknown",
          approverEmail: user[0]?.email || "Unknown",
          comment: comment || "",
          requestId,
        }),
      });

      const projectApproversList = await db
        .select()
        .from(projectApprovers)
        .where(eq(projectApprovers.projectId, request[0].projectId));

      const approvals = await db
        .select()
        .from(projectStatusApprovals)
        .where(eq(projectStatusApprovals.requestId, requestId));

      const approvedCount = approvals.filter(
        (a) => a.status === "APPROVED"
      ).length;
      const rejectedCount = approvals.filter(
        (a) => a.status === "REJECTED"
      ).length;

      if (rejectedCount > 0) {
        // Request rejected
        await db
          .update(projectStatusRequests)
          .set({ status: "REJECTED", completedAt: new Date() })
          .where(eq(projectStatusRequests.id, requestId));

        // Log rejection
        await this.insertAuditLog({
          actorId: userId,
          action: "Status Change Request Rejected",
          targetType: "project",
          targetId: request[0].projectId,
          metadata: JSON.stringify({
            fromStatus: request[0].fromStatus,
            toStatus: request[0].toStatus,
            reason: "One or more approvers rejected the request",
          }),
        });
      } else if (approvedCount === projectApproversList.length) {
        // All approved, update project status
        await db
          .update(projectStatusRequests)
          .set({ status: "APPROVED", completedAt: new Date() })
          .where(eq(projectStatusRequests.id, requestId));

        await db
          .update(projects)
          .set({ status: request[0].toStatus, updatedAt: new Date() })
          .where(eq(projects.id, request[0].projectId));

        // Log successful status change
        await this.insertAuditLog({
          actorId: userId,
          action: "Status Updated",
          targetType: "project",
          targetId: request[0].projectId,
          metadata: JSON.stringify({
            from: request[0].fromStatus,
            to: request[0].toStatus,
            approvedBy: "All approvers",
            totalApprovers: projectApproversList.length,
          }),
        });
      }
    } catch (error) {
      console.error("Error approving status change:", error);
      throw error;
    }
  }

  async rejectStatusChange(
    requestId: string,
    userId: string,
    comment: string
  ): Promise<void> {
    try {
      // Record the rejection
      await db.insert(projectStatusApprovals).values({
        requestId,
        approverId: userId,
        status: "REJECTED",
        comment,
        approvedAt: new Date(),
      });

      // Get request and user info for audit log
      const request = await db
        .select()
        .from(projectStatusRequests)
        .where(eq(projectStatusRequests.id, requestId))
        .limit(1);

      if (request.length === 0) return;

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Log individual rejection
      await this.insertAuditLog({
        actorId: userId,
        action: "Status Change Rejected",
        targetType: "project",
        targetId: request[0].projectId,
        metadata: JSON.stringify({
          fromStatus: request[0].fromStatus,
          toStatus: request[0].toStatus,
          approverName: user[0]?.name || "Unknown",
          approverEmail: user[0]?.email || "Unknown",
          comment: comment || "",
          requestId,
        }),
      });

      // Mark request as rejected
      await db
        .update(projectStatusRequests)
        .set({ status: "REJECTED", completedAt: new Date() })
        .where(eq(projectStatusRequests.id, requestId));

      // Log final rejection
      await this.insertAuditLog({
        actorId: userId,
        action: "Status Change Request Rejected",
        targetType: "project",
        targetId: request[0].projectId,
        metadata: JSON.stringify({
          fromStatus: request[0].fromStatus,
          toStatus: request[0].toStatus,
          rejectedBy: user[0]?.name || "Unknown",
          reason: comment || "No reason provided",
        }),
      });
    } catch (error) {
      console.error("Error rejecting status change:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, username))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(
    id: string,
    updateData: Partial<InsertUser>
  ): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getProjects(): Promise<Project[]> {
    try {
      return await db.select().from(projects).orderBy(desc(projects.createdAt));
    } catch (error) {
      console.error("Error in getProjects:", error);
      return [];
    }
  }

  async getProjectsForUser(
    userId: string,
    userRole: string
  ): Promise<Project[]> {
    try {
      // Admin can see all projects
      if (userRole === "ADMIN") {
        return await db
          .select()
          .from(projects)
          .orderBy(desc(projects.createdAt));
      }

      // For other users, filter by team membership, ownership, or approver status
      const userProjects = await db
        .select()
        .from(projects)
        .where(
          sql`${projects.ownerId} = ${userId} OR 
              ${userId} = ANY(${projects.teamMembers}) OR 
              EXISTS (
                SELECT 1 FROM ${projectApprovers} 
                WHERE ${projectApprovers.projectId} = ${projects.id} 
                AND ${projectApprovers.userId} = ${userId}
              )`
        )
        .orderBy(desc(projects.createdAt));

      return userProjects;
    } catch (error) {
      console.error("Error in getProjectsForUser:", error);
      return [];
    }
  }

  async getProjectsWithOwner(): Promise<any[]> {
    try {
      const projectsData = await db
        .select({
          id: projects.id,
          code: projects.code,
          title: projects.title,
          description: projects.description,
          type: projects.type,
          methodology: projects.methodology,
          status: projects.status,
          priority: projects.priority,
          category: projects.category,
          teamMembers: projects.teamMembers,
          ownerName: users.name,
          createdAt: projects.createdAt,
        })
        .from(projects)
        .leftJoin(users, eq(projects.ownerId, users.id))
        .orderBy(desc(projects.createdAt));

      // Get document counts separately (excluding deleted documents)
      const projectsWithCounts = [];
      for (const project of projectsData) {
        try {
          const docCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(documents)
            .where(
              and(
                eq(documents.projectId, project.id),
                sql`${documents.status} != 'DELETED'`
              )
            );

          projectsWithCounts.push({
            ...project,
            owner: {
              name: project.ownerName || "Unknown",
              initials: (project.ownerName || "UN")
                .split(" ")
                .map((n) => n[0])
                .join(""),
            },
            documentCount: docCount[0]?.count || 0,
          });
        } catch (docError) {
          console.error(
            `Error getting document count for project ${project.id}:`,
            docError
          );
          projectsWithCounts.push({
            ...project,
            owner: {
              name: project.ownerName || "Unknown",
              initials: (project.ownerName || "UN")
                .split(" ")
                .map((n) => n[0])
                .join(""),
            },
            documentCount: 0,
          });
        }
      }

      return projectsWithCounts;
    } catch (error) {
      console.error("Error in getProjectsWithOwner:", error);
      return [];
    }
  }

  async getProjectsWithOwnerForUser(
    userId: string,
    userRole: string
  ): Promise<any[]> {
    try {
      let projectsData;

      // Admin can see all projects
      if (userRole === "ADMIN") {
        projectsData = await db
          .select({
            id: projects.id,
            code: projects.code,
            title: projects.title,
            description: projects.description,
            type: projects.type,
            methodology: projects.methodology,
            status: projects.status,
            priority: projects.priority,
            category: projects.category,
            teamMembers: projects.teamMembers,
            ownerName: users.name,
            createdAt: projects.createdAt,
          })
          .from(projects)
          .leftJoin(users, eq(projects.ownerId, users.id))
          .orderBy(desc(projects.createdAt));
      } else {
        // For other users, filter by team membership, ownership, or approver status
        projectsData = await db
          .select({
            id: projects.id,
            code: projects.code,
            title: projects.title,
            description: projects.description,
            type: projects.type,
            methodology: projects.methodology,
            status: projects.status,
            priority: projects.priority,
            category: projects.category,
            teamMembers: projects.teamMembers,
            ownerName: users.name,
            createdAt: projects.createdAt,
          })
          .from(projects)
          .leftJoin(users, eq(projects.ownerId, users.id))
          .where(
            sql`${projects.ownerId} = ${userId} OR 
                ${userId} = ANY(${projects.teamMembers}) OR 
                EXISTS (
                  SELECT 1 FROM ${projectApprovers} 
                  WHERE ${projectApprovers.projectId} = ${projects.id} 
                  AND ${projectApprovers.userId} = ${userId}
                )`
          )
          .orderBy(desc(projects.createdAt));
      }

      // Get document counts separately (excluding deleted documents)
      const projectsWithCounts = [];
      for (const project of projectsData) {
        try {
          const docCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(documents)
            .where(
              and(
                eq(documents.projectId, project.id),
                sql`${documents.status} != 'DELETED'`
              )
            );

          projectsWithCounts.push({
            ...project,
            owner: {
              name: project.ownerName || "Unknown",
              initials: (project.ownerName || "UN")
                .split(" ")
                .map((n) => n[0])
                .join(""),
            },
            documentCount: docCount[0]?.count || 0,
          });
        } catch (docError) {
          console.error(
            `Error getting document count for project ${project.id}:`,
            docError
          );
          projectsWithCounts.push({
            ...project,
            owner: {
              name: project.ownerName || "Unknown",
              initials: (project.ownerName || "UN")
                .split(" ")
                .map((n) => n[0])
                .join(""),
            },
            documentCount: 0,
          });
        }
      }

      return projectsWithCounts;
    } catch (error) {
      console.error("Error in getProjectsWithOwnerForUser:", error);
      return [];
    }
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    try {
      const result = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error in getProjectById:", error);
      return undefined;
    }
  }

  async checkProjectAccess(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    try {
      // Admin has access to all projects
      if (userRole === "ADMIN") {
        return true;
      }

      // Check if user is owner, team member, or approver
      const result = await db
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            eq(projects.id, projectId),
            sql`${projects.ownerId} = ${userId} OR 
                ${userId} = ANY(${projects.teamMembers}) OR 
                EXISTS (
                  SELECT 1 FROM ${projectApprovers} 
                  WHERE ${projectApprovers.projectId} = ${projectId} 
                  AND ${projectApprovers.userId} = ${userId}
                )`
          )
        )
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error("Error in checkProjectAccess:", error);
      return false;
    }
  }
  async insertProject(
    insertProject: Omit<InsertProject, "code">
  ): Promise<Project> {
    const year = new Date().getFullYear();
    const projectCount = await db
      .select()
      .from(projects)
      .where(eq(projects.type, insertProject.type));
    const nextNumber = projectCount.length + 1;
    const prefix = insertProject.type === "Project" ? "PRJ" : "NP";
    const code = `${prefix}-${year}-${String(nextNumber).padStart(3, "0")}`;

    const result = await db
      .insert(projects)
      .values({
        ...insertProject,
        code,
      })
      .returning();

    // Log project creation
    await this.insertAuditLog({
      actorId: insertProject.ownerId,
      action: "Project Created",
      targetType: "project",
      targetId: result[0].id,
      metadata: JSON.stringify({
        title: insertProject.title,
        type: insertProject.type,
      }),
    });

    return result[0];
  }

  async updateProject(
    id: string,
    updateData: Partial<InsertProject>
  ): Promise<Project | undefined> {
    const oldProject = await this.getProjectById(id);
    const result = await db
      .update(projects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    // Log status change if status was updated - actorId should be passed from route
    if (updateData.status && oldProject?.status !== updateData.status) {
      // This will be updated when called from route with proper actorId
    }

    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getDocuments(projectId?: string): Promise<any[]> {
    try {
      const query = db
        .select({
          id: documents.id,
          filename: documents.filename,
          type: documents.type,
          version: documents.version,
          status: documents.status,
          priority: documents.priority,
          createdAt: documents.createdAt,
          createdByName: users.name,
          lifecycleStep: documents.lifecycleStep,
        })
        .from(documents)
        .leftJoin(users, eq(documents.createdById, users.id))
        .where(
          projectId
            ? and(eq(documents.projectId, projectId), sql`status != 'DELETED'`)
            : sql`status != 'DELETED'`
        )
        .orderBy(desc(documents.createdAt));

      const result = await query;

      return result.map((d) => ({
        ...d,
        uploadedBy: d.createdByName || "Unknown",
        uploadedAt: d.createdAt
          ? new Date(d.createdAt).toLocaleDateString()
          : "Unknown",
      }));
    } catch (error) {
      console.error("Error in getDocuments:", error);
      return [];
    }
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);
    return result[0];
  }

  async insertDocument(insertDocument: InsertDocument): Promise<Document> {
    const result = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return result[0];
  }

  async deleteDocument(id: string, actorId?: string): Promise<void> {
    const document = await this.getDocumentById(id);
    if (!document) return;

    try {
      await db.transaction(async (tx) => {
        // 1. Delete comments associated with the document
        await tx.delete(comments).where(eq(comments.documentId, id));

        // 2. Delete signature envelopes
        await tx.delete(signatureEnvelopes).where(eq(signatureEnvelopes.documentId, id));

        // 3. Delete approvals (rounds and approvers)
        // First get rounds to delete approvers
        const rounds = await tx.select().from(approvalRounds).where(eq(approvalRounds.documentId, id));
        for (const round of rounds) {
          await tx.delete(approvers).where(eq(approvers.roundId, round.id));
        }
        await tx.delete(approvalRounds).where(eq(approvalRounds.documentId, id));

        // 4. Mark document as deleted in database
        // We do a soft delete to preserve audit history if needed, or we could hard delete.
        // Given the user wants to "delete", let's stick to the current soft-delete logic
        // BUT if the previous implementation was causing issues with "deleted" items reappearing or conflicting,
        // we might consider hard delete if status='DELETED' is not filtered correctly elsewhere.
        // However, based on getDocuments logic, it filters status != 'DELETED'.
        
        // If file exists, delete it
        if (document.storageKey && fs.existsSync(document.storageKey)) {
          try {
            fs.unlinkSync(document.storageKey);
          } catch (err) {
            console.error('Failed to delete physical file:', err);
            // Continue execution, don't fail transaction just because file is missing/locked
          }
        }

        await tx
          .update(documents)
          .set({
            status: "DELETED",
            filename: `[DELETED] ${document.filename}`,
            storageKey: `deleted_${document.storageKey}`
          })
          .where(eq(documents.id, id));
          
        // Optional: Insert audit log for deletion inside the transaction if we want strict audit
      });
    } catch (error) {
      console.error('Error in deleteDocument transaction:', error);
      throw error; // Propagate error to route handler
    }
  }

  async configureApprovers(
    documentId: string,
    approverIds: string[],
    approvalMode: string = "SEQUENTIAL",
    approvalSteps: any[] = [],
    actorId?: string,
    priority: string = "MEDIUM"
  ): Promise<void> {
    console.log("=== configureApprovers START ===");
    console.log("Parameters:", {
      documentId,
      approverIds,
      approverIdsType: typeof approverIds,
      approverIdsLength: Array.isArray(approverIds)
        ? approverIds.length
        : "not array",
      approvalMode,
      approvalSteps,
      actorId,
      priority,
    });

    try {
      // Enhanced input validation
      if (!documentId) {
        throw new Error("Document ID is required");
      }

      if (!approverIds) {
        throw new Error("Approver IDs are required");
      }

      if (!Array.isArray(approverIds)) {
        throw new Error("Approver IDs must be an array");
      }

      if (approverIds.length === 0) {
        throw new Error("At least one approver ID is required");
      }

      // Validate each approver ID
      for (const id of approverIds) {
        if (!id || typeof id !== "string") {
          throw new Error(`Invalid approver ID: ${id}`);
        }
      }

      if (!["SEQUENTIAL", "PARALLEL"].includes(approvalMode)) {
        console.log(
          `Invalid approval mode '${approvalMode}', defaulting to SEQUENTIAL`
        );
        approvalMode = "SEQUENTIAL";
      }

      console.log("Input validation passed");

      // Check if document exists
      console.log("Checking if document exists...");
      const document = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      if (document.length === 0) {
        throw new Error("Document not found");
      }
      console.log("Document found:", document[0].filename);

      // Check document status - prevent modification if approval has started
      if (
        document[0].status === "APPROVED" ||
        document[0].status === "REJECTED" ||
        document[0].status === "SIGNED"
      ) {
        throw new Error(
          "Cannot modify approvers for a document that has been approved, rejected, or signed"
        );
      }

      // Get existing approval rounds to check if approval has started
      console.log("Checking existing approval rounds...");
      const existingRounds = await db
        .select()
        .from(approvalRounds)
        .where(eq(approvalRounds.documentId, documentId));

      if (existingRounds.length > 0) {
        // Check if any approver has already approved/rejected
        const existingApprovers = await db
          .select()
          .from(approvers)
          .where(eq(approvers.roundId, existingRounds[0].id));
        const hasStartedApproving = existingApprovers.some(
          (a) => a.status !== "PENDING"
        );

        if (hasStartedApproving) {
          throw new Error(
            "Cannot modify approvers once approval process has started"
          );
        }

        // Check if trying to change approval mode
        if (existingRounds[0].mode !== approvalMode) {
          throw new Error(
            "Cannot change approval mode once approvers are configured"
          );
        }

        console.log("Deleting existing approval rounds and approvers...");
        // Delete existing approvers first (due to foreign key constraint)
        for (const round of existingRounds) {
          await db.delete(approvers).where(eq(approvers.roundId, round.id));
        }
        // Then delete approval rounds
        await db
          .delete(approvalRounds)
          .where(eq(approvalRounds.documentId, documentId));
        console.log("Existing approval data deleted");
      }

      // Get and validate approver users
      console.log("Fetching approver users...");
      const approverUsers = await db
        .select()
        .from(users)
        .where(inArray(users.id, approverIds));
      console.log(
        `Found ${approverUsers.length} valid users out of ${approverIds.length} requested`
      );

      if (approverUsers.length === 0) {
        throw new Error("No valid approver users found for the provided IDs");
      }

      if (approverUsers.length !== approverIds.length) {
        const foundIds = approverUsers.map((u) => u.id);
        const missingIds = approverIds.filter((id) => !foundIds.includes(id));
        console.warn("Some approver IDs not found:", missingIds);
      }

      // Create new approval round
      console.log("Creating new approval round...");
      const [newRound] = await db
        .insert(approvalRounds)
        .values({
          documentId,
          mode: approvalMode,
          orderIndex: 0,
          status: "PENDING",
          priority: priority || "MEDIUM",
        })
        .returning();
      console.log("Approval round created:", newRound.id);

      // Prepare approver data
      console.log("Preparing approver data...");
      const approverData = approverUsers.map((user, index) => {
        const data = {
          roundId: newRound.id,
          userId: user.id,
          email: user.email,
          orderIndex: index,
          mustSign: true,
          status: "PENDING" as const,
          signedAt: null,
        };
        console.log(`Approver ${index + 1}:`, {
          userId: user.id,
          email: user.email,
          orderIndex: index,
        });
        return data;
      });

      // Insert approvers
      console.log("Inserting approvers...");
      await db.insert(approvers).values(approverData);
      console.log("Approvers inserted successfully");

      // Update document status
      console.log("Updating document status...");
      await db
        .update(documents)
        .set({ status: "IN_REVIEW" })
        .where(eq(documents.id, documentId));
      console.log("Document status updated to IN_REVIEW");

      // Insert audit log
      if (actorId) {
        console.log("Creating audit log...");
        await this.insertAuditLog({
          actorId,
          action: "Approval Workflow Configured",
          targetType: "document",
          targetId: documentId,
          metadata: JSON.stringify({
            mode: approvalMode,
            priority: priority || "MEDIUM",
            approverCount: approverUsers.length,
            requestedCount: approverIds.length,
            approvers: approverUsers.map((u) => ({
              id: u.id,
              email: u.email,
              name: u.name,
            })),
          }),
        });
        console.log("Audit log created");
      }

      console.log("=== configureApprovers SUCCESS ===");
    } catch (error: any) {
      console.error("=== configureApprovers ERROR ===");
      console.error("Error type:", typeof error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Input parameters:", {
        documentId,
        approverIds,
        approverIdsType: typeof approverIds,
        approverIdsIsArray: Array.isArray(approverIds),
        approverIdsLength: Array.isArray(approverIds)
          ? approverIds.length
          : "N/A",
        approvalMode,
        priority,
        actorId,
      });
      throw error;
    }
  }

  async getPendingApprovals(userId?: string): Promise<any[]> {
    if (!userId) return [];

    const userApprovers = await db
      .select({
        roundId: approvers.roundId,
        documentId: approvalRounds.documentId,
        status: approvers.status,
        orderIndex: approvers.orderIndex,
        mode: approvalRounds.mode,
      })
      .from(approvers)
      .innerJoin(approvalRounds, eq(approvers.roundId, approvalRounds.id))
      .where(
        and(eq(approvers.userId, userId), eq(approvers.status, "PENDING"))
      );

    if (userApprovers.length === 0) return [];

    const validApprovals = [];
    for (const approval of userApprovers) {
      if (approval.mode === "SEQUENTIAL") {
        // For sequential, only the next approver in order can approve
        const allApproversInRound = await db
          .select()
          .from(approvers)
          .where(eq(approvers.roundId, approval.roundId))
          .orderBy(approvers.orderIndex);

        const pendingApprovers = allApproversInRound.filter(
          (a) => a.status === "PENDING"
        );
        if (pendingApprovers.length > 0) {
          const nextApprover = pendingApprovers[0]; // First pending approver
          if (approval.orderIndex === nextApprover.orderIndex) {
            validApprovals.push(approval.documentId);
          }
        }
      } else if (approval.mode === "PARALLEL") {
        // For parallel, all pending approvers can approve simultaneously
        validApprovals.push(approval.documentId);
      }
    }

    if (validApprovals.length === 0) return [];

    const pendingDocs = await db
      .select({
        id: documents.id,
        filename: documents.filename,
        type: documents.type,
        lifecycleStep: documents.lifecycleStep,
        projectId: documents.projectId,
        projectCode: projects.code,
        projectTitle: projects.title,
        requesterName: users.name,
        status: documents.status,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .leftJoin(projects, eq(documents.projectId, projects.id))
      .leftJoin(users, eq(documents.createdById, users.id))
      .where(inArray(documents.id, validApprovals));

    return pendingDocs.map((doc) => {
      const daysDiff = Math.floor(
        (new Date().getTime() -
          new Date(doc.createdAt || new Date()).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const dueDate =
        daysDiff === 0
          ? "Today"
          : daysDiff === 1
          ? "Tomorrow"
          : daysDiff < 0
          ? `${Math.abs(daysDiff)} days ago`
          : `In ${daysDiff} days`;
      const priority =
        Math.abs(daysDiff) > 2
          ? "High"
          : Math.abs(daysDiff) > 0
          ? "Medium"
          : "Low";

      return {
        id: doc.id,
        documentName: doc.filename,
        documentType: doc.type,
        lifecycleStep: doc.lifecycleStep,
        projectCode: doc.projectCode || `PRJ-${doc.projectId?.slice(0, 8)}`,
        projectTitle: doc.projectTitle || "Unknown Project",
        requester: {
          name: doc.requesterName || "Unknown User",
          initials: (doc.requesterName || "UN")
            .split(" ")
            .map((n) => n[0])
            .join(""),
        },
        dueDate,
        status: "PENDING",
        priority,
      };
    });
  }

  async getCompletedApprovals(userId?: string): Promise<any[]> {
    if (!userId) return [];

    try {
      // Get document approvals
      const userApprovers = await db
        .select({
          documentId: approvalRounds.documentId,
          status: approvers.status,
          signedAt: approvers.signedAt,
        })
        .from(approvers)
        .innerJoin(approvalRounds, eq(approvers.roundId, approvalRounds.id))
        .where(
          and(
            eq(approvers.userId, userId),
            inArray(approvers.status, ["APPROVED", "REJECTED"])
          )
        );

      // Get status change approvals
      const statusApprovals = await db
        .select({
          requestId: projectStatusApprovals.requestId,
          status: projectStatusApprovals.status,
          approvedAt: projectStatusApprovals.approvedAt,
          comment: projectStatusApprovals.comment,
          fromStatus: projectStatusRequests.fromStatus,
          toStatus: projectStatusRequests.toStatus,
          projectTitle: projects.title,
          projectCode: projects.code,
        })
        .from(projectStatusApprovals)
        .innerJoin(
          projectStatusRequests,
          eq(projectStatusApprovals.requestId, projectStatusRequests.id)
        )
        .innerJoin(projects, eq(projectStatusRequests.projectId, projects.id))
        .where(
          and(
            eq(projectStatusApprovals.approverId, userId),
            inArray(projectStatusApprovals.status, ["APPROVED", "REJECTED"])
          )
        );

      const completedItems: any[] = [];

      // Process document approvals
      if (userApprovers.length > 0) {
        const documentIds = userApprovers.map((a) => a.documentId);

        const completedDocs = await db
          .select({
            id: documents.id,
            filename: documents.filename,
            type: documents.type,
            lifecycleStep: documents.lifecycleStep,
            projectCode: projects.code,
            projectTitle: projects.title,
            requesterName: users.name,
          })
          .from(documents)
          .leftJoin(projects, eq(documents.projectId, projects.id))
          .leftJoin(users, eq(documents.createdById, users.id))
          .where(inArray(documents.id, documentIds));

        completedDocs.forEach((doc) => {
          const approval = userApprovers.find((a) => a.documentId === doc.id);
          completedItems.push({
            id: doc.id,
            type: "DOCUMENT",
            documentName: doc.filename,
            documentType: doc.type,
            lifecycleStep: doc.lifecycleStep,
            projectCode: doc.projectCode || "N/A",
            projectTitle: doc.projectTitle || "Unknown Project",
            requester: {
              name: doc.requesterName || "Unknown User",
              initials: (doc.requesterName || "UN")
                .split(" ")
                .map((n) => n[0])
                .join(""),
            },
            status: approval?.status || "APPROVED",
            completedAt: approval?.signedAt,
            comment: "",
          });
        });
      }

      // Process status change approvals
      statusApprovals.forEach((approval) => {
        completedItems.push({
          id: `status_${approval.requestId}`,
          type: "STATUS_CHANGE",
          documentName: `Status Change: ${approval.projectTitle}`,
          documentType: `${approval.fromStatus} → ${approval.toStatus}`,
          lifecycleStep: "Status Change",
          projectCode: approval.projectCode || "N/A",
          projectTitle: approval.projectTitle || "Unknown Project",
          requester: {
            name: "System",
            initials: "SY",
          },
          status: approval.status,
          completedAt: approval.approvedAt,
          comment: approval.comment || "",
        });
      });

      return completedItems.sort(
        (a, b) =>
          new Date(b.completedAt || 0).getTime() -
          new Date(a.completedAt || 0).getTime()
      );
    } catch (error) {
      console.error("Error getting completed approvals:", error);
      return [];
    }
  }

  async getAllPendingApprovals(): Promise<any[]> {
    try {
      const allApprovers = await db
        .select({
          roundId: approvers.roundId,
          documentId: approvalRounds.documentId,
          status: approvers.status,
          orderIndex: approvers.orderIndex,
          mode: approvalRounds.mode,
          userId: approvers.userId,
        })
        .from(approvers)
        .innerJoin(approvalRounds, eq(approvers.roundId, approvalRounds.id))
        .where(eq(approvers.status, "PENDING"));

      if (allApprovers.length === 0) return [];

      const documentIds = Array.from(new Set((allApprovers as any[]).map((a: any) => a.documentId))) as string[];

      const pendingDocs = await db
        .select({
          id: documents.id,
          filename: documents.filename,
          type: documents.type,
          lifecycleStep: documents.lifecycleStep,
          projectId: documents.projectId,
          projectCode: projects.code,
          projectTitle: projects.title,
          requesterName: users.name,
          status: documents.status,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .leftJoin(projects, eq(documents.projectId, projects.id))
        .leftJoin(users, eq(documents.createdById, users.id))
        .where(inArray(documents.id, documentIds));

      return pendingDocs.map((doc) => {
        const daysDiff = Math.floor(
          (new Date().getTime() -
            new Date(doc.createdAt || new Date()).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const dueDate =
          daysDiff === 0
            ? "Today"
            : daysDiff === 1
            ? "Tomorrow"
            : daysDiff < 0
            ? `${Math.abs(daysDiff)} days ago`
            : `In ${daysDiff} days`;
        const priority =
          Math.abs(daysDiff) > 2
            ? "High"
            : Math.abs(daysDiff) > 0
            ? "Medium"
            : "Low";

        return {
          id: doc.id,
          documentName: doc.filename,
          documentType: doc.type,
          lifecycleStep: doc.lifecycleStep,
          projectCode: doc.projectCode || `PRJ-${doc.projectId?.slice(0, 8)}`,
          projectTitle: doc.projectTitle || "Unknown Project",
          requester: {
            name: doc.requesterName || "Unknown User",
            initials: (doc.requesterName || "UN")
              .split(" ")
              .map((n) => n[0])
              .join(""),
          },
          dueDate,
          status: "PENDING",
          priority,
        };
      });
    } catch (error) {
      console.error("Error getting all pending approvals:", error);
      return [];
    }
  }

  async getAllCompletedApprovals(): Promise<any[]> {
    try {
      const allApprovers = await db
        .select({
          documentId: approvalRounds.documentId,
          status: approvers.status,
          signedAt: approvers.signedAt,
          userId: approvers.userId,
        })
        .from(approvers)
        .innerJoin(approvalRounds, eq(approvers.roundId, approvalRounds.id))
        .where(inArray(approvers.status, ["APPROVED", "REJECTED"]));

      if (allApprovers.length === 0) return [];

      const documentIds = Array.from(new Set((allApprovers as any[]).map((a: any) => a.documentId))) as string[];

      const completedDocs = await db
        .select({
          id: documents.id,
          filename: documents.filename,
          type: documents.type,
          lifecycleStep: documents.lifecycleStep,
          projectCode: projects.code,
          projectTitle: projects.title,
          requesterName: users.name,
        })
        .from(documents)
        .leftJoin(projects, eq(documents.projectId, projects.id))
        .leftJoin(users, eq(documents.createdById, users.id))
        .where(inArray(documents.id, documentIds));

      const completedItems: any[] = [];

      completedDocs.forEach((doc) => {
        const approvals = allApprovers.filter((a) => a.documentId === doc.id);
        approvals.forEach((approval) => {
          completedItems.push({
            id: `${doc.id}_${approval.userId}`,
            type: "DOCUMENT",
            documentName: doc.filename,
            documentType: doc.type,
            lifecycleStep: doc.lifecycleStep,
            projectCode: doc.projectCode || "N/A",
            projectTitle: doc.projectTitle || "Unknown Project",
            requester: {
              name: doc.requesterName || "Unknown User",
              initials: (doc.requesterName || "UN")
                .split(" ")
                .map((n) => n[0])
                .join(""),
            },
            status: approval.status,
            completedAt: approval.signedAt,
            comment: "",
          });
        });
      });

      return completedItems.sort(
        (a, b) =>
          new Date(b.completedAt || 0).getTime() -
          new Date(a.completedAt || 0).getTime()
      );
    } catch (error) {
      console.error("Error getting all completed approvals:", error);
      return [];
    }
  }

  async getAllPendingStatusApprovals(): Promise<any[]> {
    try {
      const pendingRequests = await db
        .select({
          id: projectStatusRequests.id,
          projectId: projectStatusRequests.projectId,
          fromStatus: projectStatusRequests.fromStatus,
          toStatus: projectStatusRequests.toStatus,
          requestedBy: projectStatusRequests.requestedBy,
          createdAt: projectStatusRequests.createdAt,
          projectTitle: projects.title,
          projectCode: projects.code,
          projectType: projects.type,
          projectMethodology: projects.methodology,
          projectDescription: projects.description,
          requesterName: users.name,
          requesterEmail: users.email,
          requesterDepartment: users.department,
        })
        .from(projectStatusRequests)
        .leftJoin(projects, eq(projectStatusRequests.projectId, projects.id))
        .leftJoin(users, eq(projectStatusRequests.requestedBy, users.id))
        .where(eq(projectStatusRequests.status, "PENDING"));

      return pendingRequests.map((request) => {
        const daysDiff = Math.floor(
          (new Date().getTime() -
            new Date(request.createdAt || new Date()).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const priority =
          daysDiff > 3 ? "High" : daysDiff > 1 ? "Medium" : "Low";

        return {
          id: request.id,
          type: "WORKFLOW_APPROVAL",
          projectId: request.projectId,
          projectTitle: request.projectTitle || "Unknown Project",
          projectCode: request.projectCode || "N/A",
          projectType: request.projectType,
          projectMethodology: request.projectMethodology,
          projectDescription: request.projectDescription,
          fromStatus: request.fromStatus,
          toStatus: request.toStatus,
          requester: {
            name: request.requesterName || "Unknown User",
            email: request.requesterEmail,
            department: request.requesterDepartment,
            initials: (request.requesterName || "UN")
              .split(" ")
              .map((n) => n[0])
              .join(""),
          },
          approvalMode: "SEQUENTIAL",
          orderIndex: 0,
          priority,
          status: "PENDING",
          submittedAt: request.createdAt,
          dueDate:
            daysDiff === 0
              ? "Today"
              : daysDiff === 1
              ? "Tomorrow"
              : `${daysDiff} days ago`,
        };
      });
    } catch (error) {
      console.error("Error getting all pending status approvals:", error);
      return [];
    }
  }

  async insertComment(insertComment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(insertComment).returning();
    return result[0];
  }

  async getProjectComments(projectId: string): Promise<any[]> {
    try {
      console.log("Getting comments for project:", projectId);

      const result = await db
        .select({
          id: comments.id,
          body: comments.body,
          attachmentPath: comments.attachmentPath,
          attachmentName: comments.attachmentName,
          createdAt: comments.createdAt,
          authorName: users.name,
          authorEmail: users.email,
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.projectId, projectId))
        .orderBy(desc(comments.createdAt));

      console.log("Raw comments result:", result.length);

      if (!result || result.length === 0) {
        return [];
      }

      return result.map((comment) => ({
        ...comment,
        author: {
          name: comment.authorName || "Unknown User",
          initials: (comment.authorName || "UN")
            .split(" ")
            .map((n) => n[0])
            .join(""),
          email: comment.authorEmail,
        },
        createdAt: comment.createdAt
          ? new Date(comment.createdAt).toLocaleString()
          : "Unknown",
      }));
    } catch (error) {
      console.error("Error in getProjectComments:", error);
      return [];
    }
  }

  async insertProjectComment(commentData: any): Promise<any> {
    const result = await db
      .insert(comments)
      .values({
        projectId: commentData.projectId,
        authorId: commentData.authorId,
        body: commentData.body,
        attachmentPath: commentData.attachmentPath,
        attachmentName: commentData.attachmentName,
      })
      .returning();

    // Get comment with author info
    const commentWithAuthor = await db
      .select({
        id: comments.id,
        body: comments.body,
        attachmentPath: comments.attachmentPath,
        attachmentName: comments.attachmentName,
        createdAt: comments.createdAt,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.id, result[0].id))
      .limit(1);

    const comment = commentWithAuthor[0];
    return {
      ...comment,
      author: {
        name: comment.authorName || "Unknown User",
        initials: (comment.authorName || "UN")
          .split(" ")
          .map((n) => n[0])
          .join(""),
        email: comment.authorEmail,
      },
      createdAt: new Date(comment.createdAt).toLocaleString(),
    };
  }

  async getCommentById(id: string): Promise<any> {
    const result = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);
    return result[0];
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async insertAuditLog(log: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: string;
  }): Promise<void> {
    await db.insert(auditLogs).values(log);
  }

  async getAuditLogs(
    targetType: string,
    targetId: string
  ): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.targetType, targetType),
          eq(auditLogs.targetId, targetId)
        )
      )
      .orderBy(desc(auditLogs.createdAt));
  }

  async getProjectAuditLogs(projectId: string): Promise<any[]> {
    try {
      // Get project-level audit logs
      const projectLogs = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          targetType: auditLogs.targetType,
          targetId: auditLogs.targetId,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
          actorName: users.name,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorId, users.id))
        .where(
          and(
            eq(auditLogs.targetType, "project"),
            eq(auditLogs.targetId, projectId)
          )
        )
        .orderBy(desc(auditLogs.createdAt));

      // Get document-level audit logs that mention this project in metadata
      const documentLogs = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          targetType: auditLogs.targetType,
          targetId: auditLogs.targetId,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
          actorName: users.name,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorId, users.id))
        .where(
          and(
            eq(auditLogs.targetType, "document"),
            sql`${auditLogs.metadata}::text LIKE ${
              '%"projectId":"' + projectId + '"%'
            }`
          )
        )
        .orderBy(desc(auditLogs.createdAt));

      // Combine and sort all logs
      const allLogs = [...projectLogs, ...documentLogs]
        .filter(
          (log, index, self) => self.findIndex((l) => l.id === log.id) === index
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      return allLogs;
    } catch (error) {
      console.error("Error in getProjectAuditLogs:", error);
      return [];
    }
  }

  async getDocumentApprovers(documentId: string): Promise<any[]> {
    try {
      console.log("Getting document approvers for document:", documentId);

      const rounds = await db
        .select()
        .from(approvalRounds)
        .where(eq(approvalRounds.documentId, documentId));

      console.log("Found approval rounds:", rounds.length);

      if (rounds.length === 0) {
        console.log("No approval rounds found for document:", documentId);
        return [];
      }

      const approversList = await db
        .select({
          id: approvers.id,
          email: approvers.email,
          status: approvers.status,
          orderIndex: approvers.orderIndex,
          signedAt: approvers.signedAt,
          userName: users.name,
        })
        .from(approvers)
        .leftJoin(users, eq(approvers.userId, users.id))
        .where(eq(approvers.roundId, rounds[0].id))
        .orderBy(approvers.orderIndex);

      console.log("Found approvers:", approversList.length);

      return approversList.map((a) => ({
        ...a,
        name: a.userName || a.email,
        initials: (a.userName || a.email)
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
      }));
    } catch (error: any) {
      console.error("Error in getDocumentApprovers:", error);
      console.error("Error stack:", error.stack);
      return [];
    }
  }

  async getApprovalMode(documentId: string): Promise<string> {
    try {
      console.log("Getting approval mode for document:", documentId);

      const rounds = await db
        .select()
        .from(approvalRounds)
        .where(eq(approvalRounds.documentId, documentId))
        .orderBy(desc(approvalRounds.createdAt))
        .limit(1);

      console.log("Found approval rounds for mode:", rounds.length);

      const mode = rounds.length > 0 ? rounds[0].mode : "SEQUENTIAL";
      console.log("Returning approval mode:", mode);

      return mode;
    } catch (error: any) {
      console.error("Error in getApprovalMode:", error);
      console.error("Error stack:", error.stack);
      return "SEQUENTIAL";
    }
  }

  async approveDocument(documentId: string, userId: string): Promise<void> {
    console.log(`Approving document ${documentId} by user ${userId}`);

    // Update approver status
    const rounds = await db
      .select()
      .from(approvalRounds)
      .where(eq(approvalRounds.documentId, documentId));

    console.log(`Found ${rounds.length} approval rounds`);

    if (rounds.length > 0) {
      await db
        .update(approvers)
        .set({ status: "APPROVED", signedAt: new Date() })
        .where(
          and(eq(approvers.roundId, rounds[0].id), eq(approvers.userId, userId))
        );

      console.log(`Updated approver status to APPROVED`);

      // Check if all approvers have approved
      const allApprovers = await db
        .select()
        .from(approvers)
        .where(eq(approvers.roundId, rounds[0].id));

      console.log(
        `All approvers:`,
        allApprovers.map((a) => ({ userId: a.userId, status: a.status }))
      );

      const pendingApprovers = allApprovers.filter(
        (a) => a.status === "PENDING"
      );
      console.log(`Pending approvers: ${pendingApprovers.length}`);

      if (pendingApprovers.length === 0) {
        // All approvers have completed, update document status
        const hasRejected = allApprovers.some((a) => a.status === "REJECTED");
        const allApproved = allApprovers.every((a) => a.status === "APPROVED");

        let newStatus;
        if (hasRejected) {
          newStatus = "REJECTED";
        } else if (allApproved) {
          newStatus = "APPROVED";
        } else {
          newStatus = "IN_REVIEW"; // fallback
        }

        console.log(
          `All approvers completed. New document status: ${newStatus}`
        );
        console.log(
          `Approver statuses:`,
          allApprovers.map((a) => ({ userId: a.userId, status: a.status }))
        );

        await db
          .update(documents)
          .set({ status: newStatus })
          .where(eq(documents.id, documentId));

        await db
          .update(approvalRounds)
          .set({ status: "COMPLETED" })
          .where(eq(approvalRounds.id, rounds[0].id));

        console.log(`Document status updated to: ${newStatus}`);
        console.log(`Approval round status updated to: COMPLETED`);

        // Log completion
        await this.insertAuditLog({
          actorId: userId,
          action: hasRejected ? "Document Rejected" : "Document Fully Approved",
          targetType: "document",
          targetId: documentId,
          metadata: JSON.stringify({
            finalStatus: newStatus,
            totalApprovers: allApprovers.length,
            approvedCount: allApprovers.filter((a) => a.status === "APPROVED")
              .length,
            rejectedCount: allApprovers.filter((a) => a.status === "REJECTED")
              .length,
          }),
        });
      }
    }

    // Log individual approval with document details
    const document = await this.getDocumentById(documentId);
    await this.insertAuditLog({
      actorId: userId,
      action: "Document Approved",
      targetType: "document",
      targetId: documentId,
      metadata: JSON.stringify({
        documentName: document?.filename,
        documentType: document?.type,
      }),
    });
  }

  async rejectDocument(documentId: string, userId: string): Promise<void> {
    // Update approver status
    const rounds = await db
      .select()
      .from(approvalRounds)
      .where(eq(approvalRounds.documentId, documentId));

    if (rounds.length > 0) {
      await db
        .update(approvers)
        .set({ status: "REJECTED", signedAt: new Date() })
        .where(
          and(eq(approvers.roundId, rounds[0].id), eq(approvers.userId, userId))
        );

      // Update approval round status
      await db
        .update(approvalRounds)
        .set({ status: "COMPLETED" })
        .where(eq(approvalRounds.id, rounds[0].id));
    }

    // Update document status
    await db
      .update(documents)
      .set({ status: "REJECTED" })
      .where(eq(documents.id, documentId));

    // Log rejection with document details
    const document = await this.getDocumentById(documentId);
    await this.insertAuditLog({
      actorId: userId,
      action: "Document Rejected",
      targetType: "document",
      targetId: documentId,
      metadata: JSON.stringify({
        documentName: document?.filename,
        documentType: document?.type,
      }),
    });
  }

  async forceUpdateDocumentStatus(
    documentId: string,
    status: string
  ): Promise<void> {
    console.log(`Force updating document ${documentId} status to: ${status}`);

    await db
      .update(documents)
      .set({ status })
      .where(eq(documents.id, documentId));

    // Update approval round status if completed
    if (status === "APPROVED" || status === "REJECTED") {
      const rounds = await db
        .select()
        .from(approvalRounds)
        .where(eq(approvalRounds.documentId, documentId));

      if (rounds.length > 0) {
        await db
          .update(approvalRounds)
          .set({ status: "COMPLETED" })
          .where(eq(approvalRounds.id, rounds[0].id));
      }
    }

    // Log status change
    await this.insertAuditLog({
      action: "Document Status Force Updated",
      targetType: "document",
      targetId: documentId,
      metadata: JSON.stringify({ newStatus: status }),
    });

    console.log(`Document ${documentId} status updated to: ${status}`);
  }

  // Project approval methods using audit logs for storage
  async getProjectApprovers(projectId: string): Promise<any[]> {
    try {
      console.log("Getting project approvers for project:", projectId);

      const approvers = await db
        .select({
          id: projectApprovers.id,
          userId: projectApprovers.userId,
          email: projectApprovers.email,
          orderIndex: projectApprovers.orderIndex,
          mode: projectApprovers.mode,
          userName: users.name,
          userDepartment: users.department,
        })
        .from(projectApprovers)
        .leftJoin(users, eq(projectApprovers.userId, users.id))
        .where(eq(projectApprovers.projectId, projectId))
        .orderBy(projectApprovers.orderIndex);

      console.log("Found approvers:", approvers.length);

      if (approvers.length === 0) {
        console.log("No approvers found for project:", projectId);
        return [];
      }

      // Get current pending request for this project
      const currentRequest = await this.getProjectStatusRequest(projectId);
      let approvals: any[] = [];

      if (currentRequest) {
        approvals = await db
          .select({
            approverId: projectStatusApprovals.approverId,
            status: projectStatusApprovals.status,
            comment: projectStatusApprovals.comment,
            approvedAt: projectStatusApprovals.approvedAt,
          })
          .from(projectStatusApprovals)
          .where(eq(projectStatusApprovals.requestId, currentRequest.id));
      }

      const result = approvers.map((approver) => {
        const approval = approvals.find(
          (a) => a.approverId === approver.userId
        );

        return {
          id: approver.userId,
          name: approver.userName || approver.email,
          email: approver.email,
          role: approver.userDepartment || "Approver",
          initials: (approver.userName || approver.email)
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
          orderIndex: approver.orderIndex,
          status: approval?.status || "PENDING",
          comment: approval?.comment || "",
          approvedAt: approval?.approvedAt,
          sequential: approver.mode === "SEQUENTIAL",
        };
      });

      console.log("Returning approvers:", result);
      return result;
    } catch (error: any) {
      console.error("Error getting project approvers:", error);
      console.error("Error stack:", error.stack);
      return [];
    }
  }

  async configureProjectApprovers(
    projectId: string,
    approverIds: string[],
    mode: string = "SEQUENTIAL",
    priority: string = "MEDIUM"
  ): Promise<void> {
    try {
      console.log("Configuring project approvers for project:", projectId);
      console.log("Approver IDs:", approverIds);
      console.log("Mode:", mode);
      console.log("Priority:", priority);

      // Delete existing approvers
      await db
        .delete(projectApprovers)
        .where(eq(projectApprovers.projectId, projectId));
      console.log("Deleted existing approvers");

      // Get approver users
      const approverUsers = await db
        .select()
        .from(users)
        .where(inArray(users.id, approverIds));
      console.log("Found approver users:", approverUsers.length);

      if (approverUsers.length === 0) {
        throw new Error("No valid approver users found");
      }

      // Insert new approvers
      const approverData = approverUsers.map((user, index) => ({
        projectId,
        userId: user.id,
        email: user.email,
        orderIndex: index,
        mode,
      }));

      console.log("Inserting approver data:", approverData);
      await db.insert(projectApprovers).values(approverData);
      console.log("Approvers inserted successfully");

      // Store approver configuration in audit log with approver names
      const approverNames = approverUsers
        .map((u) => u.name || u.email)
        .join(", ");
      const firstUser = await db.select().from(users).limit(1);
      await this.insertAuditLog({
        actorId: firstUser[0]?.id || approverUsers[0].id,
        action: "Project Approvers Configured",
        targetType: "project",
        targetId: projectId,
        metadata: JSON.stringify({
          approverCount: approverUsers.length,
          approverNames,
          mode,
          priority,
          configuredAt: new Date().toISOString(),
        }),
      });
      console.log("Audit log created");
    } catch (error: any) {
      console.error("Error configuring project approvers:", error);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }

  async deleteProjectApprover(
    projectId: string,
    approverId: string
  ): Promise<void> {
    try {
      await db
        .delete(projectApprovers)
        .where(
          and(
            eq(projectApprovers.projectId, projectId),
            eq(projectApprovers.id, approverId)
          )
        );
    } catch (error) {
      console.error("Error deleting project approver:", error);
      throw error;
    }
  }

  async getProjectApprovalStatus(projectId: string): Promise<any> {
    try {
      const approvers = await this.getProjectApprovers(projectId);
      const totalApprovers = approvers.length;
      const approvedCount = approvers.filter(
        (a) => a.status === "APPROVED"
      ).length;
      const rejectedCount = approvers.filter(
        (a) => a.status === "REJECTED"
      ).length;
      const pendingCount = approvers.filter(
        (a) => a.status === "PENDING"
      ).length;

      let overallStatus = "PENDING";
      if (rejectedCount > 0) {
        overallStatus = "REJECTED";
      } else if (pendingCount === 0 && approvedCount === totalApprovers) {
        overallStatus = "APPROVED";
      }

      return {
        status: overallStatus,
        totalApprovers,
        approvedCount,
        rejectedCount,
        pendingCount,
        approvers,
      };
    } catch (error) {
      console.error("Error getting project approval status:", error);
      return { status: "PENDING", approvers: [] };
    }
  }

  async getApproverLifecycle(
    approverId: string,
    projectId?: string
  ): Promise<any[]> {
    try {
      const sdlcStatuses = [
        "Initiative Submitted",
        "Demand Prioritized",
        "Initiative Approved",
        "Kick Off",
        "ARF",
        "Deployment Preparation",
        "RCB",
        "Deployment",
        "PTR",
        "Go Live",
      ];

      // Get status change approvals for this user and project
      const statusApprovals = await db
        .select({
          toStatus: projectStatusRequests.toStatus,
          approvalStatus: projectStatusApprovals.status,
          approvedAt: projectStatusApprovals.approvedAt,
          comment: projectStatusApprovals.comment,
        })
        .from(projectStatusApprovals)
        .innerJoin(
          projectStatusRequests,
          eq(projectStatusApprovals.requestId, projectStatusRequests.id)
        )
        .where(
          and(
            eq(projectStatusApprovals.approverId, approverId),
            projectId
              ? eq(projectStatusRequests.projectId, projectId)
              : sql`1=1`
          )
        );

      // Map SDLC statuses to approval status
      return sdlcStatuses.map((status) => {
        const approval = statusApprovals.find((a) => a.toStatus === status);
        return {
          status,
          approvalStatus: approval?.approvalStatus || "NOT_REACHED",
          approvedAt: approval?.approvedAt,
          comment: approval?.comment,
        };
      });
    } catch (error) {
      console.error("Error getting approver lifecycle:", error);
      return [];
    }
  }

  async createDocuSealEnvelope(
    document: Document,
    approvers: any[]
  ): Promise<SignatureEnvelope> {
    try {
      console.log(
        "Creating DocuSeal envelope for document:",
        document.filename
      );
      console.log("Document storage key:", document.storageKey);
      console.log("Number of approvers:", approvers.length);

      // Check if file exists
      if (!fs.existsSync(document.storageKey)) {
        throw new Error(`Document file not found: ${document.storageKey}`);
      }

      // Read document file
      const fileBuffer = fs.readFileSync(document.storageKey);
      console.log("File buffer size:", fileBuffer.length);

      // Prepare DocuSeal recipients
      const recipients = approvers.map((approver, index) => ({
        email: approver.email,
        name: approver.name || approver.email,
        role: "signer" as const,
        orderIndex: index,
      }));
      console.log("Recipients prepared:", recipients);

      // Step 1: Create template in DocuSeal
      console.log("Calling docusealService.createTemplate...");
      const template = await docusealService.createTemplate({
        fileBuffer,
        filename: document.filename,
        title: `Approval Required: ${document.filename}`,
        recipients,
        sequential: true,
      });
      console.log("Template created successfully:", template);

      // Save template info to database
      const [signatureEnvelope] = await db
        .insert(signatureEnvelopes)
        .values({
          documentId: document.id,
          docusealTemplateId: template.templateId,
          docusealEditUrl: template.editUrl,
          status: "TEMPLATE_CREATED",
        })
        .returning();
      console.log("Signature envelope saved:", signatureEnvelope.id);

      // Update document status
      await db
        .update(documents)
        .set({ status: "TEMPLATE_SETUP" })
        .where(eq(documents.id, document.id));
      console.log("Document status updated to TEMPLATE_SETUP");

      // Log template creation
      await this.insertAuditLog({
        action: "DocuSeal Template Created",
        targetType: "document",
        targetId: document.id,
        metadata: JSON.stringify({
          templateId: template.templateId,
          editUrl: template.editUrl,
        }),
      });
      console.log("Audit log created");

      return signatureEnvelope;
    } catch (error: any) {
      console.error("Failed to create DocuSeal template:", error);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }

  async sendDocuSealForSigning(envelopeId: string): Promise<void> {
    try {
      const [envelope] = await db
        .select()
        .from(signatureEnvelopes)
        .where(eq(signatureEnvelopes.id, envelopeId))
        .limit(1);

      if (!envelope || !envelope.docusealTemplateId) {
        throw new Error("Template not found");
      }

      // Get approvers for this document
      const approvers = await this.getDocumentApprovers(envelope.documentId);

      // Create submission
      const submission = await docusealService.createSubmission(
        envelope.docusealTemplateId,
        approvers.map((approver) => ({
          email: approver.email,
          name: approver.name,
          role: "signer",
        }))
      );

      // Update envelope with submission info
      await db
        .update(signatureEnvelopes)
        .set({
          docusealSubmissionId: submission.submissionId,
          docusealUrl: submission.url,
          status: "SENT",
        })
        .where(eq(signatureEnvelopes.id, envelopeId));

      // Update document status
      await db
        .update(documents)
        .set({ status: "IN_REVIEW" })
        .where(eq(documents.id, envelope.documentId));

      // Log submission creation
      await this.insertAuditLog({
        action: "DocuSeal Submission Created",
        targetType: "document",
        targetId: envelope.documentId,
        metadata: JSON.stringify({
          submissionId: submission.submissionId,
          url: submission.url,
        }),
      });
    } catch (error) {
      console.error("Failed to send DocuSeal for signing:", error);
      throw error;
    }
  }

  async getSignatureStatus(
    documentId: string
  ): Promise<SignatureEnvelope | undefined> {
    try {
      const [envelope] = await db
        .select()
        .from(signatureEnvelopes)
        .where(eq(signatureEnvelopes.documentId, documentId))
        .limit(1);

      return envelope;
    } catch (error) {
      console.error("Failed to get signature status:", error);
      throw error;
    }
  }

  async processDocuSealWebhook(payload: any): Promise<void> {
    try {
      const { event_type, data } = payload;
      const envelopeId = data?.id;

      if (!envelopeId) return;

      // Find our envelope record
      const [envelope] = await db
        .select()
        .from(signatureEnvelopes)
        .where(eq(signatureEnvelopes.docusealEnvelopeId, envelopeId))
        .limit(1);

      if (!envelope) return;

      switch (event_type) {
        case "envelope.completed":
          // Update envelope status
          await db
            .update(signatureEnvelopes)
            .set({
              status: "COMPLETED",
              completedAt: new Date(),
            })
            .where(eq(signatureEnvelopes.id, envelope.id));

          // Update document status
          await db
            .update(documents)
            .set({ status: "SIGNED" })
            .where(eq(documents.id, envelope.documentId));

          // Update all approvers to approved
          const rounds = await db
            .select()
            .from(approvalRounds)
            .where(eq(approvalRounds.documentId, envelope.documentId));

          if (rounds.length > 0) {
            await db
              .update(approvers)
              .set({ status: "APPROVED", signedAt: new Date() })
              .where(eq(approvers.roundId, rounds[0].id));
          }

          // Log completion
          await this.insertAuditLog({
            action: "Document Fully Signed",
            targetType: "document",
            targetId: envelope.documentId,
            metadata: JSON.stringify({ envelopeId }),
          });
          break;

        case "envelope.declined":
        case "envelope.voided":
          // Update envelope status
          await db
            .update(signatureEnvelopes)
            .set({ status: "DECLINED" })
            .where(eq(signatureEnvelopes.id, envelope.id));

          // Update document status
          await db
            .update(documents)
            .set({ status: "REJECTED" })
            .where(eq(documents.id, envelope.documentId));

          // Log decline/void
          await this.insertAuditLog({
            action:
              event_type === "envelope.declined"
                ? "Document Declined"
                : "Document Voided",
            targetType: "document",
            targetId: envelope.documentId,
            metadata: JSON.stringify({ envelopeId }),
          });
          break;

        case "recipient.completed":
          // Individual signer completed - update specific approver
          const signerEmail = data?.recipient?.email;
          if (signerEmail) {
            const rounds = await db
              .select()
              .from(approvalRounds)
              .where(eq(approvalRounds.documentId, envelope.documentId));

            if (rounds.length > 0) {
              await db
                .update(approvers)
                .set({ status: "APPROVED", signedAt: new Date() })
                .where(
                  and(
                    eq(approvers.roundId, rounds[0].id),
                    eq(approvers.email, signerEmail)
                  )
                );
            }

            // Log individual signature
            await this.insertAuditLog({
              action: "Individual Signature Completed",
              targetType: "document",
              targetId: envelope.documentId,
              metadata: JSON.stringify({ envelopeId, signerEmail }),
            });
          }
          break;
      }
    } catch (error) {
      console.error("Failed to process DocuSeal webhook:", error);
      throw error;
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private comments: Map<string, Comment> = new Map();
  private approvals: Map<string, any> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed users only
    const users = [
      {
        id: "1",
        name: "John Doe",
        email: "john.doe@bni.co.id",
        password: "password",
        role: "REQUESTER" as const,
        department: "IT - PMO",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane.smith@bni.co.id",
        password: "password",
        role: "APPROVER" as const,
        department: "IT - Development",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        name: "Mike Johnson",
        email: "mike.johnson@bni.co.id",
        password: "password",
        role: "ADMIN" as const,
        department: "IT - Security",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    users.forEach((user) => this.users.set(user.id, user));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = {
      ...insertUser,
      role: insertUser.role || 'REQUESTER',
      department: insertUser.department || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(
    id: string,
    updateData: Partial<InsertUser>
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updateData,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsForUser(
    userId: string,
    userRole: string
  ): Promise<Project[]> {
    if (userRole === "ADMIN") {
      return Array.from(this.projects.values());
    }
    // Mock implementation - return empty for non-admin users
    return [];
  }

  async getProjectsWithOwner(): Promise<any[]> {
    return [];
  }

  async getProjectsWithOwnerForUser(
    userId: string,
    userRole: string
  ): Promise<any[]> {
    return [];
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async checkProjectAccess(
    projectId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    // Mock implementation - admin has access, others don't
    return userRole === "ADMIN";
  }

  async insertProject(
    insertProject: Omit<InsertProject, "code">
  ): Promise<Project> {
    const id = crypto.randomUUID();
    const year = new Date().getFullYear();
    const prefix = insertProject.type === "Project" ? "PRJ" : "NP";
    const code = `${prefix}-${year}-${String(this.projects.size + 1).padStart(
      3,
      "0"
    )}`;
    const project: Project = {
      status: "Initiative Submitted",
      ...insertProject,
      description: insertProject.description || null,
      category: insertProject.category || null,
      priority: insertProject.priority || 'MEDIUM',
      teamMembers: insertProject.teamMembers || null,
      id,
      code,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(
    id: string,
    updateData: Partial<InsertProject>
  ): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = {
      ...project,
      ...updateData,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async getDocuments(projectId?: string): Promise<any[]> {
    return [];
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    // Mock implementation for MemStorage
    return {
      id,
      filename: "sample.pdf",
      storageKey: "uploads/sample.pdf",
      type: "application/pdf",
      projectId: "1",
      lifecycleStep: "FS",
      version: 1,
      status: "DRAFT",
      createdById: "1",
      priority: "MEDIUM",
      createdAt: new Date(),

    };
  }

  async insertDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = crypto.randomUUID();
    const document: Document = {
      ...insertDocument,
      priority: insertDocument.priority || 'MEDIUM',
      lifecycleStep: insertDocument.lifecycleStep || null,
      id,
      version: 1,
      status: "DRAFT",
      createdAt: new Date(),

    };
    // this.documents.set(id, document); // this.documents is not a Map
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    // Mock implementation for MemStorage
    console.log(`Deleting document ${id}`);
  }

  async configureApprovers(
    documentId: string,
    approverIds: string[],
    approvalMode: string = "SEQUENTIAL",
    approvalSteps: any[] = [],
    actorId?: string,
    priority: string = "MEDIUM"
  ): Promise<void> {
    console.log(`Configuring approvers for document ${documentId}:`, {
      approvers: approverIds,
      mode: approvalMode,
      steps: approvalSteps,
      actor: actorId,
      priority,
    });
  }

  async getPendingApprovals(userId?: string): Promise<any[]> {
    return [];
  }

  async getCompletedApprovals(userId?: string): Promise<any[]> {
    return [];
  }

  async approveDocument(documentId: string, userId?: string): Promise<void> {
    const approval = this.approvals.get(documentId);
    if (approval) {
      approval.status = "SIGNED";
      this.approvals.set(documentId, approval);
    }
    console.log(
      `Document ${documentId} approved by user ${userId || "system"}`
    );
  }

  async insertAuditLog(log: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: string;
  }): Promise<void> {
    console.log("Audit log:", log);
  }

  async getAuditLogs(
    targetType: string,
    targetId: string
  ): Promise<AuditLog[]> {
    return [];
  }

  async getProjectAuditLogs(projectId: string): Promise<any[]> {
    return [
      {
        id: "1",
        action: "Project Created",
        targetType: "project",
        targetId: projectId,
        metadata: JSON.stringify({ title: "Sample Project" }),
        createdAt: new Date(),
        actorName: "John Doe",
      },
    ];
  }

  async getDocumentApprovers(documentId: string): Promise<any[]> {
    return [];
  }

  async getApprovalMode(documentId: string): Promise<string> {
    return "SEQUENTIAL";
  }

  async rejectDocument(documentId: string, userId: string): Promise<void> {
    const approval = this.approvals.get(documentId);
    if (approval) {
      approval.status = "REJECTED";
      this.approvals.set(documentId, approval);
    }
    console.log(`Document ${documentId} rejected by user ${userId}`);
  }

  async insertComment(insertComment: InsertComment): Promise<Comment> {
    const id = crypto.randomUUID();
    const comment: Comment = {
      ...insertComment,
      projectId: insertComment.projectId || null,
      documentId: insertComment.documentId || null,
      attachmentPath: insertComment.attachmentPath || null,
      attachmentName: insertComment.attachmentName || null,
      id,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getProjectComments(projectId: string): Promise<any[]> {
    return [];
  }

  async insertProjectComment(commentData: any): Promise<any> {
    const id = crypto.randomUUID();
    const comment = {
      id,
      ...commentData,
      author: {
        name: "Mock User",
        initials: "MU",
        email: "mock@example.com",
      },
      createdAt: new Date().toLocaleString(),
    };
    return comment;
  }

  async getCommentById(id: string): Promise<any> {
    return this.comments.get(id);
  }

  async deleteComment(id: string): Promise<void> {
    this.comments.delete(id);
  }

  async createDocuSealEnvelope(
    document: Document,
    approvers: any[]
  ): Promise<SignatureEnvelope> {
    // Mock implementation for MemStorage
    const envelope: SignatureEnvelope = {
      id: crypto.randomUUID(),
      documentId: document.id,
      docusealEnvelopeId: `env_${Date.now()}`,
      docusealUrl: `https://mock.docuseal.co/sign/${Date.now()}`,
      docusealTemplateId: null,
      docusealSubmissionId: null,
      docusealEditUrl: null,
      status: "SENT",
      createdAt: new Date(),
      completedAt: null,
    };
    console.log(
      `Mock DocuSeal envelope created for document ${document.filename}`
    );
    return envelope;
  }

  async sendDocuSealForSigning(envelopeId: string): Promise<void> {
    console.log(`Sending DocuSeal envelope ${envelopeId} for signing`);
  }

  async getSignatureStatus(
    documentId: string
  ): Promise<SignatureEnvelope | undefined> {
    // Mock implementation for MemStorage
    return {
      id: crypto.randomUUID(),
      documentId,
      docusealTemplateId: "template_123",
      docusealSubmissionId: "submission_456",
      docusealEnvelopeId: "envelope_789",
      docusealUrl: "http://168.110.206.144:3000/s/abc123",
      docusealEditUrl: "http://168.110.206.144:3000/templates/123/edit",
      status: "SENT",
      createdAt: new Date(),
      completedAt: null,
    };
  }

  async processDocuSealWebhook(payload: any): Promise<void> {
    // Mock implementation for MemStorage
    console.log("Processing DocuSeal webhook:", payload.event_type);
  }

  async forceUpdateDocumentStatus(
    documentId: string,
    status: string
  ): Promise<void> {
    console.log(
      `Mock: Force updating document ${documentId} status to: ${status}`
    );
  }

  // Project approval methods
  async getProjectApprovers(projectId: string): Promise<any[]> {
    return [];
  }

  async configureProjectApprovers(
    projectId: string,
    approverIds: string[],
    mode: string = "SEQUENTIAL",
    priority: string = "MEDIUM"
  ): Promise<void> {
    console.log(
      `Mock: Configuring project approvers for ${projectId} with priority ${priority}`
    );
  }

  async deleteProjectApprover(
    projectId: string,
    approverId: string
  ): Promise<void> {
    console.log(
      `Mock: Deleting project approver ${approverId} from project ${projectId}`
    );
  }

  async getProjectApprovalStatus(projectId: string): Promise<any> {
    return { status: "PENDING", approvers: [] };
  }

  async getProjectStatusRequest(projectId: string): Promise<any> {
    return undefined;
  }

  async getApproverLifecycle(
    approverId: string,
    projectId?: string
  ): Promise<any[]> {
    return [];
  }

  async getPendingStatusApprovals(userId?: string): Promise<any[]> {
    return [];
  }

  async approveStatusChange(
    requestId: string,
    userId: string,
    comment: string
  ): Promise<void> {
    console.log(`Mock: Approving status change ${requestId} by user ${userId}`);
  }

  async rejectStatusChange(
    requestId: string,
    userId: string,
    comment: string
  ): Promise<void> {
    console.log(`Mock: Rejecting status change ${requestId} by user ${userId}`);
  }

  async createStatusChangeRequest(
    projectId: string,
    fromStatus: string,
    toStatus: string,
    userId: string
  ): Promise<string> {
    const requestId = crypto.randomUUID();
    console.log(
      `Mock: Creating status change request ${requestId} for project ${projectId}`
    );
    return requestId;
  }
  async getAllPendingApprovals(): Promise<any[]> {
    return [];
  }

  async getAllCompletedApprovals(): Promise<any[]> {
    return [];
  }

  async getAllPendingStatusApprovals(): Promise<any[]> {
    return [];
  }
}

export const storage = new DatabaseStorage();
