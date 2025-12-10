import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Check, X, MessageSquare, ChevronUp, ChevronDown } from "lucide-react";

import ApprovalCommentDialog from "@/components/ApprovalCommentDialog";
import DocumentApprovalCard from "@/components/DocumentApprovalCard";
import WorkflowApprovalCard from "@/components/WorkflowApprovalCard";
import ApprovalStageCard from "@/components/ApprovalStageCard";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";

export default function MyApprovals() {
  const { toast } = useToast();
  const { canViewApprovals, user, loading } = useAuth();
  
  const [approvals, setApprovals] = useState<any[]>([]);
  const [completedApprovals, setCompletedApprovals] = useState<any[]>([]);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    document: any;
    action: string | null;
  }>({ open: false, document: null, action: null });
  const [expandedCards, setExpandedCards] = useState(new Set());
  
  const fetchApprovals = async () => {
    try {
      const [docResponse, statusResponse] = await Promise.all([
        fetch('/api/approvals'),
        fetch('/api/approvals/status-changes')
      ]);
      
      let allApprovals: any[] = [];
      
      if (docResponse.ok) {
        const docData = await docResponse.json();
        console.log('Document approvals:', docData);
        if (Array.isArray(docData)) {
          const docApprovals = docData.map((approval: any) => ({ ...approval, type: 'DOCUMENT_APPROVAL' }));
          allApprovals = [...allApprovals, ...docApprovals];
        }
      } else {
        console.error('Document approvals fetch failed:', docResponse.status);
      }
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Status approvals:', statusData);
        if (Array.isArray(statusData)) {
          allApprovals = [...allApprovals, ...statusData];
        }
      } else {
        console.error('Status approvals fetch failed:', statusResponse.status);
      }
      
      console.log('All approvals combined:', allApprovals);
      setApprovals(allApprovals);
    } catch (error: any) {
      console.error('Failed to fetch approvals:', error);
    }
  };
  
  const fetchCompletedApprovals = async () => {
    try {
      const response = await fetch('/api/approvals/completed');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setCompletedApprovals(data);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch completed approvals:', error);
    }
  };
  
  useEffect(() => {
    fetchApprovals();
    fetchCompletedApprovals();
  }, []);
  


  const handleApprove = (approval: any) => {
    setApprovalDialog({
      open: true,
      document: {
        id: approval.id,
        documentName: approval.documentName,
        projectTitle: approval.projectTitle
      },
      action: 'approve'
    });
  };

  const handleDecline = (approval: any) => {
    setApprovalDialog({
      open: true,
      document: {
        id: approval.id,
        documentName: approval.documentName,
        projectTitle: approval.projectTitle
      },
      action: 'reject'
    });
  };

  const handleApprovalConfirm = async (comment: string) => {
    const { document, action } = approvalDialog;
    if (!document || !action) return;

    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      let response;
      
      // Check if this is a workflow approval
      const approval = approvals.find(a => a.id === document.id);
      if (approval?.type === 'WORKFLOW_APPROVAL') {
        response = await fetch(`/api/approvals/status-changes/${document.id}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment })
        });
      } else {
        response = await fetch(`/api/documents/${document.id}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment })
        });
      }
      
      if (response.ok) {
        setApprovalDialog({ open: false, document: null, action: null });
        await fetchApprovals();
        await fetchCompletedApprovals();
        toast({
          title: action === 'approve' ? "Approved" : "Rejected",
          description: `${document.documentName} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
          variant: action === 'approve' ? 'default' : 'destructive'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action}`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Server is not available. Please try again later.",
        variant: "destructive",
      });
    }
  };



  const pendingApprovals = approvals || [];

  const toggleCardExpansion = (approvalId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(approvalId)) {
      newExpanded.delete(approvalId);
    } else {
      newExpanded.add(approvalId);
    }
    setExpandedCards(newExpanded);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }
  
  if (!canViewApprovals()) {
    return <Redirect to="/" />;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Approvals</h1>
        <p className="text-muted-foreground">Review and approve pending documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-semibold mt-1">{pendingApprovals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingApprovals.filter(a => a.type === 'WORKFLOW_APPROVAL').length} workflow, {pendingApprovals.filter(a => a.type === 'DOCUMENT_APPROVAL').length} documents
              </p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <FileText className="h-6 w-6 text-warning" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-semibold mt-1">
                {pendingApprovals.filter(a => a.priority === "High").length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Requires immediate attention
              </p>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold mt-1">{completedApprovals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {completedApprovals.filter(a => a.status === 'APPROVED').length} approved, {completedApprovals.filter(a => a.status === 'REJECTED').length} rejected
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <Check className="h-6 w-6 text-success" />
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
        <div className="space-y-3">
          {pendingApprovals.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
              <p className="text-muted-foreground">
                You don't have any documents waiting for your approval at the moment.
              </p>
            </Card>
          ) : (
            pendingApprovals.map((approval) => {
              if (approval.type === 'WORKFLOW_APPROVAL') {
                return (
                  <WorkflowApprovalCard
                    key={approval.id}
                    approval={approval}
                    isExpanded={expandedCards.has(approval.id)}
                    onToggleExpand={() => toggleCardExpansion(approval.id)}
                    onApprove={() => handleApprove(approval)}
                    onReject={() => handleDecline(approval)}
                  />
                );
              } else {
                return (
                  <DocumentApprovalCard
                    key={approval.id}
                    approval={approval}
                    isExpanded={expandedCards.has(approval.id)}
                    onToggleExpand={() => toggleCardExpansion(approval.id)}
                    onApprove={() => handleApprove(approval)}
                    onReject={() => handleDecline(approval)}
                  />
                );
              }
            })
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recently Completed</h2>
        <div className="space-y-3">
          {completedApprovals.length === 0 ? (
            <Card className="p-8 text-center opacity-70">
              <Check className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Completed Approvals</h3>
              <p className="text-muted-foreground">
                Your completed approvals will appear here.
              </p>
            </Card>
          ) : (
            completedApprovals.map((approval) => (
              <Card key={approval.id} className="opacity-70">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    approval.status === "APPROVED" ? "bg-success/10" : "bg-destructive/10"
                  }`}>
                    {approval.status === "APPROVED" ? (
                      <Check className="h-5 w-5 text-success" />
                    ) : (
                      <X className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{approval.documentName || approval.documentType || 'Document'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {approval.projectCode} - {approval.projectTitle}
                        </p>
                        {approval.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed: {new Date(approval.completedAt).toLocaleDateString()} at {new Date(approval.completedAt).toLocaleTimeString()}
                          </p>
                        )}
                        {approval.documentType && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              {approval.documentType}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={approval.status === "APPROVED" ? "default" : "destructive"}>
                          {approval.status === "APPROVED" ? "Approved" : "Rejected"}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleCardExpansion(`completed-${approval.id}`)}
                        >
                          {expandedCards.has(`completed-${approval.id}`) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-brand-teal text-white text-xs">
                            {approval.requester?.initials || approval.requesterName?.split(' ').map((n: any) => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {approval.requester?.name || approval.requesterName || 'Unknown User'}
                        </span>
                      </div>
                      
                      {approval.documentType && (
                        <span className="text-sm text-muted-foreground">Type: {approval.documentType}</span>
                      )}
                      
                      {approval.lifecycleStep && (
                        <Badge variant="outline" className="text-xs">
                          {approval.lifecycleStep}
                        </Badge>
                      )}
                      
                      {approval.comment && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground max-w-xs">
                          <MessageSquare className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate" title={approval.comment}>
                            "{approval.comment}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {expandedCards.has(`completed-${approval.id}`) && (
                <div className="px-6 pb-6 pt-0">
                  <div className="border-t pt-4 space-y-4">
                    {/* Completed Approval Details */}
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-3">Approval Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <span className={`ml-2 font-medium ${
                            approval.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {approval.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Document Type:</span>
                          <span className="ml-2 font-medium">{approval.documentType || 'N/A'}</span>
                        </div>
                        {approval.completedAt && (
                          <div>
                            <span className="text-muted-foreground">Completed:</span>
                            <span className="ml-2 font-medium">
                              {new Date(approval.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {approval.lifecycleStep && (
                          <div>
                            <span className="text-muted-foreground">Lifecycle Step:</span>
                            <span className="ml-2 font-medium">{approval.lifecycleStep}</span>
                          </div>
                        )}
                      </div>
                      {approval.comment && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-muted-foreground text-sm">Your Comment:</span>
                          <p className="mt-1 text-sm bg-background rounded p-2 border">
                            "{approval.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Approval Stage Card */}
                    <ApprovalStageCard
                      documentId={approval.id}
                      documentName={approval.documentName}
                      lifecycleStep={approval.lifecycleStep || 'Unknown'}
                      projectTitle={approval.projectTitle}
                      projectCode={approval.projectCode}
                    />
                  </div>
                </div>
              )}
            </Card>
            ))
          )}
        </div>
      </div>

      <ApprovalCommentDialog
        open={approvalDialog.open}
        onOpenChange={(open) => setApprovalDialog({ open, document: null, action: null })}
        document={approvalDialog.document}
        action={approvalDialog.action as any}
        onConfirm={handleApprovalConfirm}
      />
    </div>
  );
}