import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, ChevronDown, CheckCircle, XCircle, Upload, Trash2, Settings, MessageSquare, FileText, RefreshCw, PenTool } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/StatusBadge";
import TimelineStepper from "@/components/TimelineStepper";
import DocumentRow from "@/components/DocumentRow";
import ApproverDetailCard from "@/components/ApproverDetailCard";
import CommentThread from "@/components/CommentThread";
import UploadDocumentDialog from "@/components/UploadDocumentDialog";
import ConfigureApprovalDialog from "@/components/ConfigureApprovalDialog";
import ViewDocumentDialog from "@/components/ViewDocumentDialog";
import ConfigureProjectApprovalDialog from "@/components/ConfigureProjectApprovalDialog";
import EditProjectDetailDialog from "@/components/EditProjectDetailDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ProjectDetail() {
  const { toast } = useToast();
  const { canUploadDocument, canUpdateProjectStatus, canConfigureApprovers, canDeleteProject } = useAuth();
  const [match, params] = useRoute('/projects/:id');
  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedLifecycleStep, setSelectedLifecycleStep] = useState("");
  const [showConfigureSignatureDialog, setShowConfigureSignatureDialog] = useState(false);
  const [selectedDocumentIdForSignature, setSelectedDocumentIdForSignature] = useState("");
  const [showViewDocumentDialog, setShowViewDocumentDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [sdlcSteps, setSdlcSteps] = useState<any[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showConfigureProjectApprovalDialog, setShowConfigureProjectApprovalDialog] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [projectApprovers, setProjectApprovers] = useState<any[]>([]);
  const [pendingStatusRequest, setPendingStatusRequest] = useState(null);
  const [comments, setComments] = useState<any[]>([]);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);

  const statusOptions = [
    "Initiative Submitted", 
    "Demand Prioritized",
    "Initiative Approved",
    "Kick Off",
    "ARF",
    "Deployment Preparation", 
    "RCB",
    "Deployment",
    "PTR",
    "Go Live"
  ];

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => api.updateProjectStatus(params?.id || "", newStatus),
    onSuccess: (updatedProject: any) => {
      setProject(updatedProject);
      if (updatedProject.status) {
        generateSdlcSteps(updatedProject.status);
        setSelectedLifecycleStep(updatedProject.status);
      }
      toast({ title: "Status Updated", description: "Project status updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  });

  const generateSdlcSteps = (currentStatus: string, statusRequest: any = null) => {
    const currentIndex = orderedSdlcStatuses.findIndex(s => s === currentStatus);
    const targetIndex = statusRequest ? orderedSdlcStatuses.findIndex(s => s === statusRequest.toStatus) : -1;
    
    const steps = orderedSdlcStatuses.map((status, index) => {
      if (statusRequest && index === targetIndex) {
        return { label: status, status: "waiting" };
      }
      return {
        label: status,
        status: index < currentIndex ? "completed" : index === currentIndex ? "current" : "pending",
      };
    });
    setSdlcSteps(steps);
  };

  const orderedSdlcStatuses = [
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
  
  const fetchProject = async () => {
    if (!params?.id) return;
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };
  
  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };
  
  const fetchAuditHistory = async () => {
    if (!params?.id) return;
    try {
      const response = await fetch(`/api/projects/${params.id}/history`);
      if (response.ok) {
        const data = await response.json();
        setAuditHistory(data.map((log: any) => {
          let details = '';
          let metadata: any = {};
          
          if (log.metadata) {
            try {
              metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
              
              // Format details based on action type
              switch (log.action) {
                case 'Document Uploaded':
                  details = metadata.filename ? `Uploaded "${metadata.filename}"` : 'Document uploaded';
                  if (metadata.type) details += ` (${metadata.type})`;
                  if (metadata.lifecycleStep) details += ` for ${metadata.lifecycleStep}`;
                  if (metadata.deletedDocument) details += ' [DELETED - Audit Trail Preserved]';
                  break;
                case 'Document Deleted':
                  details = metadata.filename ? `Deleted "${metadata.filename}"` : 'Document deleted';
                  if (metadata.type) details += ` (${metadata.type})`;
                  if (metadata.lifecycleStep) details += ` from ${metadata.lifecycleStep}`;
                  if (metadata.deletedDocument) details += ' [DELETED - Audit Trail Preserved]';
                  break;
                case 'Document Approved':
                  details = metadata.documentName ? `Approved "${metadata.documentName}"` : 'Document approved';
                  if (metadata.documentType) details += ` (${metadata.documentType})`;
                  if (metadata.approverName) details += ` by ${metadata.approverName}`;
                  if (metadata.comment) details += ` - Comment: "${metadata.comment}"`;
                  if (metadata.deletedDocument) details += ' [DELETED - Audit Trail Preserved]';
                  break;
                case 'Document Rejected':
                  details = metadata.documentName ? `Rejected "${metadata.documentName}"` : 'Document rejected';
                  if (metadata.documentType) details += ` (${metadata.documentType})`;
                  if (metadata.approverName) details += ` by ${metadata.approverName}`;
                  if (metadata.comment) details += ` - Reason: "${metadata.comment}"`;
                  if (metadata.deletedDocument) details += ' [DELETED - Audit Trail Preserved]';
                  break;
                case 'Document Fully Approved':
                  details = `All approvers completed approval (${metadata.approvedCount}/${metadata.totalApprovers} approved)`;
                  break;
                case 'Status Updated':
                  details = metadata.from && metadata.to ? `Status changed from "${metadata.from}" to "${metadata.to}"` : 'Status updated';
                  if (metadata.approvedBy) details += ` (${metadata.approvedBy})`;
                  break;
                case 'Status Change Requested':
                  details = metadata.fromStatus && metadata.toStatus ? `Requested status change from "${metadata.fromStatus}" to "${metadata.toStatus}"` : 'Status change requested';
                  if (metadata.requestedBy) details += ` by ${metadata.requestedBy}`;
                  break;
                case 'Status Change Approved':
                  details = metadata.fromStatus && metadata.toStatus ? `Approved status change from "${metadata.fromStatus}" to "${metadata.toStatus}"` : 'Status change approved';
                  if (metadata.approverName) details += ` by ${metadata.approverName}`;
                  if (metadata.comment) details += ` - Comment: "${metadata.comment}"`;
                  break;
                case 'Status Change Rejected':
                  details = metadata.fromStatus && metadata.toStatus ? `Rejected status change from "${metadata.fromStatus}" to "${metadata.toStatus}"` : 'Status change rejected';
                  if (metadata.approverName) details += ` by ${metadata.approverName}`;
                  if (metadata.comment) details += ` - Reason: "${metadata.comment}"`;
                  break;
                case 'Status Change Request Rejected':
                  details = metadata.fromStatus && metadata.toStatus ? `Status change request rejected: "${metadata.fromStatus}" to "${metadata.toStatus}"` : 'Status change request rejected';
                  if (metadata.rejectedBy) details += ` by ${metadata.rejectedBy}`;
                  if (metadata.reason) details += ` - Reason: "${metadata.reason}"`;
                  break;
                case 'Approval Workflow Configured':
                  details = `Configured ${metadata.approverCount || 0} approvers`;
                  if (metadata.mode) details += ` (${metadata.mode.toLowerCase()} mode)`;
                  if (metadata.deletedDocument) details += ' [DELETED - Audit Trail Preserved]';
                  break;
                case 'Project Approvers Configured':
                  details = `Configured ${metadata.approverCount || 0} project approvers`;
                  if (metadata.mode) details += ` (${metadata.mode.toLowerCase()} mode)`;
                  if (metadata.approverNames) details += ` - Approvers: ${metadata.approverNames}`;
                  break;
                case 'Comment Added':
                  details = 'Added a comment';
                  if (metadata.commentPreview) {
                    const preview = metadata.commentPreview.length > 100 ? metadata.commentPreview.substring(0, 100) + '...' : metadata.commentPreview;
                    details += `: "${preview}"`;
                  }
                  if (metadata.hasAttachment && metadata.attachmentName) {
                    details += ` with attachment "${metadata.attachmentName}"`;
                  }
                  break;
                case 'Comment Deleted':
                  details = 'Deleted a comment';
                  if (metadata.commentPreview) {
                    const preview = metadata.commentPreview.length > 100 ? metadata.commentPreview.substring(0, 100) + '...' : metadata.commentPreview;
                    details += `: "${preview}"`;
                  }
                  if (metadata.hadAttachment && metadata.attachmentName) {
                    details += ` (had attachment "${metadata.attachmentName}")`;
                  }
                  break;
                case 'Project Created':
                  details = metadata.title ? `Created project "${metadata.title}"` : 'Project created';
                  if (metadata.type) details += ` (${metadata.type})`;
                  break;
                case 'DocuSeal Template Created':
                  details = 'Created digital signature template';
                  break;
                case 'DocuSeal Submission Created':
                  details = 'Sent document for digital signature';
                  break;
                case 'Document Fully Signed':
                  details = 'Document digitally signed by all parties';
                  break;
                case 'Individual Signature Completed':
                  details = metadata.signerEmail ? `Signed by ${metadata.signerEmail}` : 'Individual signature completed';
                  break;
                default:
                  // Fallback for any other actions
                  if (metadata.title) {
                    details = `Project: ${metadata.title}`;
                  } else if (metadata.filename) {
                    details = `Document: ${metadata.filename}`;
                  }
              }
            } catch (e) {
              console.warn('Failed to parse metadata:', e, 'Raw metadata:', log.metadata);
            }
          }
          
          // Get icon based on action type
          let icon = 'default';
          switch (log.action) {
            case 'Document Approved':
            case 'Document Fully Approved':
              icon = 'approved';
              break;
            case 'Document Rejected':
            case 'Document Declined':
              icon = 'rejected';
              break;
            case 'Document Uploaded':
              icon = 'upload';
              break;
            case 'Document Deleted':
              icon = 'delete';
              break;
            case 'Status Updated':
            case 'Status Change Requested':
            case 'Status Change Approved':
            case 'Status Change Rejected':
            case 'Status Change Request Rejected':
              icon = 'status';
              break;
            case 'Approval Workflow Configured':
              icon = 'settings';
              break;
            case 'Comment Added':
            case 'Comment Deleted':
              icon = 'comment';
              break;
            case 'Project Created':
              icon = 'project';
              break;
            case 'DocuSeal Template Created':
            case 'DocuSeal Submission Created':
            case 'Document Fully Signed':
            case 'Individual Signature Completed':
              icon = 'signature';
              break;
            default:
              icon = 'default';
          }
          
          return {
            action: log.action,
            details,
            actor: log.actorName || 'System',
            timestamp: new Date(log.createdAt).toLocaleString(),
            icon
          };
        }));
      } else {
        console.error('Failed to fetch audit history:', response.status);
        setAuditHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch audit history:', error);
      setAuditHistory([]);
    }
  };
  
  const fetchComments = async () => {
    if (!params?.id) return;
    try {
      const response = await fetch(`/api/projects/${params.id}/comments`);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setComments(data);
        } else {
          console.error('Response is not JSON:', await response.text());
          setComments([]);
        }
      } else {
        console.error('Failed to fetch comments:', response.status, response.statusText);
        setComments([]);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]);
    }
  };

  const fetchProjectApprovers = async () => {
    if (!params?.id) return;
    try {
      const response = await fetch(`/api/projects/${params.id}/approvers`);
      if (response.ok) {
        const data = await response.json();
        setProjectApprovers(data);
      } else {
        console.error('Failed to fetch project approvers:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch project approvers:', error);
    }
  };

  useEffect(() => {

    const fetchProject = async () => {
      if (!params?.id) return;
      try {
        const [projectResponse, statusRequestResponse] = await Promise.all([
          fetch(`/api/projects/${params.id}`),
          fetch(`/api/projects/${params.id}/status-request`)
        ]);
        
        if (projectResponse.ok) {
          const data = await projectResponse.json();
          
          // Check for pending status change request
          let statusRequest = null;
          if (statusRequestResponse.ok) {
            statusRequest = await statusRequestResponse.json();
            if (statusRequest) {
              data.targetStatus = statusRequest.toStatus;
              setPendingStatusRequest(statusRequest);
            }
          }
          
          setProject(data);
          if (data.status) {
            generateSdlcSteps(data.status, statusRequest);
            setSelectedLifecycleStep(data.status);
          }
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      }
    };

    const fetchDocuments = async () => {
      if (!params?.id) return;
      try {
        const response = await fetch(`/api/documents?projectId=${params.id}`);
        const data = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };

    fetchProject();
    fetchDocuments();
    fetchAuditHistory();
    fetchComments();
    fetchProjectApprovers();
  }, [params?.id]);






  const mockApprovers = [];



  const handleStepClick = (stepLabel: string) => {
    setSelectedLifecycleStep(stepLabel);
  };

  const handleDocumentAction = (action: string, doc: any) => {
    switch (action) {
      case 'view':
        setSelectedDocument({
          id: doc.id,
          filename: doc.filename,
          storageKey: doc.storageKey,
          type: doc.type || 'application/pdf'
        });
        setShowViewDocumentDialog(true);
        break;
      case 'configureSignature':
        if (!canConfigureApprovers()) {
          toast({ title: "Access Denied", description: "You don't have permission to configure approvers.", variant: "destructive" });
          return;
        }
        setSelectedDocumentIdForSignature(doc.id);
        setShowConfigureSignatureDialog(true);
        break;
      case 'checkCompletion':
        fetch(`/api/documents/${doc.id}/check-completion`, { method: 'POST' })
          .then(response => response.json())
          .then(data => {
            toast({
              title: "Status Check Complete",
              description: data.message + (data.newStatus ? ` - Status: ${data.newStatus}` : ''),
            });
            fetchDocuments(); // Refresh documents to show updated status
          })
          .catch(error => {
            toast({
              title: "Error",
              description: "Failed to check document completion.",
              variant: "destructive",
            });
          });
        break;
      case 'download':
        const link = document.createElement('a');
        link.href = `/api/documents/${doc.id}/download`;
        link.download = doc.filename;
        link.click();
        break;
      case 'delete':
        if (!canDeleteProject()) {
          toast({ title: "Access Denied", description: "You don't have permission to delete documents.", variant: "destructive" });
          return;
        }
        if (window.confirm(`Are you sure you want to delete ${doc.filename}?`)) {
          fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
            .then(response => {
              if (response.ok) {
                fetchDocuments();
                fetchAuditHistory(); // Refresh history to show preserved audit trail
                toast({ title: "Document Deleted", description: "Document has been deleted successfully. Audit trail preserved." });
              } else {
                throw new Error('Delete failed');
              }
            })
            .catch(error => {
              console.error('Delete error:', error);
              toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
            });
        }
        break;
    }
  };

  const handleConfigureApprovals = () => {
    setShowConfigureProjectApprovalDialog(true);
  };

  const handleAddComment = async (body: string, file?: File) => {
    if (!params?.id) return;
    
    try {
      const formData = new FormData();
      formData.append('body', body);
      if (file) {
        formData.append('attachment', file);
      }
      
      const response = await fetch(`/api/projects/${params.id}/comments`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          await fetchComments(); // Refresh comments
          toast({
            title: "Comment Added",
            description: "Your comment has been posted.",
          });
        } else {
          console.error('Add comment response is not JSON:', await response.text());
          throw new Error('Invalid response format');
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to add comment:', response.status, errorText);
        throw new Error(`Failed to add comment: ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchComments(); // Refresh comments
        toast({
          title: "Comment Deleted",
          description: "Comment has been deleted successfully.",
        });
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project?.title || 'Loading...'}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                  <StatusBadge status={project?.status || 'Unknown'} />
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canUpdateProjectStatus() ? statusOptions.map((statusOption) => (
                  <DropdownMenuItem 
                    key={statusOption}
                    onClick={() => updateStatusMutation.mutate(statusOption)}
                    className={project?.status === statusOption ? "bg-primary/10 text-primary font-medium" : ""}
                  >
                    {project?.status === statusOption && "✓ "}{statusOption}
                  </DropdownMenuItem>
                )) : (
                  <DropdownMenuItem disabled>
                    No permission to update status
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-brand-teal text-white text-xs">
                  {project?.owner?.initials || 'UN'}
                </AvatarFallback>
              </Avatar>
              <span>{project?.owner?.name || 'Unknown'}</span>
            </div>
            <span>•</span>
            <span>{project?.code || 'Unknown'}</span>
            <span>•</span>
            <span>{project?.methodology || 'Unknown'}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-project-menu">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEditProjectDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="p-6">
        <TimelineStepper steps={sdlcSteps} onStepClick={handleStepClick} />
      </Card>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="approvals" data-testid="tab-approvals">Approvals</TabsTrigger>
          <TabsTrigger value="comments" data-testid="tab-comments">Comments</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-3 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">All Documents</h3>
            {canUploadDocument() && (
              <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                Upload Document
              </Button>
            )}
          </div>
          {documents.map((doc) => (
            <DocumentRow
              key={`${doc.id}-${refreshCounter}`}
              {...doc}
              onView={() => handleDocumentAction('view', doc)}
              onConfigure={canConfigureApprovers() ? () => handleDocumentAction('configureSignature', doc) : undefined}
              onDownload={() => handleDocumentAction('download', doc)}
              onDelete={canDeleteProject() ? () => handleDocumentAction('delete', doc) : undefined}
              onCheckCompletion={() => handleDocumentAction('checkCompletion', doc)}
            />
          ))}
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Project Status Approval Workflow</h3>
            {canConfigureApprovers() && (
              <Button 
                size="sm" 
                data-testid="button-configure-approvals"
                onClick={handleConfigureApprovals}
              >
                Configure Approvers
              </Button>
            )}
          </div>
          <div className="space-y-4">
            {projectApprovers.length > 0 ? (
              projectApprovers.map((approver) => (
                <ApproverDetailCard 
                  key={approver.id} 
                  approver={approver} 
                  projectId={params?.id || ""}
                  currentStatus={project?.status}
                  targetStatus={project?.targetStatus}
                  onDelete={fetchProjectApprovers}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No approvers configured yet.</p>
                <p className="text-sm">Configure approvers to enable status change approvals.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <CommentThread 
            comments={comments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Project Activity History</h3>
            {auditHistory.length > 0 ? (
              <div className="space-y-3">
                {auditHistory.map((entry, index) => {
                  const getIcon = (iconType: string) => {
                    switch (iconType) {
                      case 'approved':
                        return <CheckCircle className="w-4 h-4 text-green-500" />;
                      case 'rejected':
                        return <XCircle className="w-4 h-4 text-red-500" />;
                      case 'upload':
                        return <Upload className="w-4 h-4 text-blue-500" />;
                      case 'delete':
                        return <Trash2 className="w-4 h-4 text-red-400" />;
                      case 'status':
                        return <RefreshCw className="w-4 h-4 text-orange-500" />;
                      case 'settings':
                        return <Settings className="w-4 h-4 text-gray-500" />;
                      case 'comment':
                        return <MessageSquare className="w-4 h-4 text-purple-500" />;
                      case 'project':
                        return <FileText className="w-4 h-4 text-brand-teal" />;
                      case 'signature':
                        return <PenTool className="w-4 h-4 text-indigo-500" />;
                      default:
                        return <div className="w-2 h-2 bg-primary rounded-full" />;
                    }
                  };
                  
                  return (
                    <div key={index} className="flex items-start gap-3 py-3 border-b last:border-b-0">
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(entry.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{entry.action}</p>
                          {entry.actor && (
                            <span className="text-xs text-muted-foreground">by {entry.actor}</span>
                          )}
                        </div>
                        {entry.details && (
                          <p className="text-sm text-muted-foreground mb-1">{entry.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No activity history available</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <UploadDocumentDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={fetchDocuments}
        projectId={params?.id || ""}
        lifecycleStep={selectedLifecycleStep}
      />

      <ConfigureApprovalDialog
        open={showConfigureSignatureDialog}
        onOpenChange={setShowConfigureSignatureDialog}
        documentId={selectedDocumentIdForSignature}
        onSuccess={() => {
          // Add a small delay to ensure database is updated
          setTimeout(() => {
            fetchDocuments();
            setRefreshCounter(prev => prev + 1);
          }, 100);
        }}
      />

      <ViewDocumentDialog
        open={showViewDocumentDialog}
        onOpenChange={setShowViewDocumentDialog}
        document={selectedDocument}
      />

      <ConfigureProjectApprovalDialog
        open={showConfigureProjectApprovalDialog}
        onOpenChange={setShowConfigureProjectApprovalDialog}
        projectId={params?.id || ""}
        onSuccess={fetchProjectApprovers}
      />

      <EditProjectDetailDialog
        open={showEditProjectDialog}
        onOpenChange={setShowEditProjectDialog}
        project={project}
        onSuccess={() => {
          fetchProject();
          fetchAuditHistory();
        }}
      />
    </div>
  );
}
