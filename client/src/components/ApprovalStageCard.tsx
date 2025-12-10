import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Clock, X, User } from "lucide-react";
import { useState, useEffect } from "react";

interface ApprovalStageCardProps {
  documentId: string;
  documentName: string;
  lifecycleStep: string;
  projectTitle: string;
  projectCode: string;
}

export default function ApprovalStageCard({ 
  documentId, 
  documentName, 
  lifecycleStep, 
  projectTitle, 
  projectCode 
}: ApprovalStageCardProps) {
  const [approvers, setApprovers] = useState<any[]>([]);
  const [approvalMode, setApprovalMode] = useState("SEQUENTIAL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovalDetails();
  }, [documentId]);

  const fetchApprovalDetails = async () => {
    try {
      const [approversRes, modeRes] = await Promise.all([
        fetch(`/api/documents/${documentId}/approvers`),
        fetch(`/api/documents/${documentId}/approval-mode`)
      ]);

      if (approversRes.ok) {
        const approversData = await approversRes.json();
        setApprovers(approversData);
      }

      if (modeRes.ok) {
        const modeData = await modeRes.json();
        setApprovalMode(modeData.mode);
      }
    } catch (error) {
      console.error('Failed to fetch approval details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Check className="h-4 w-4 text-success" />;
      case "REJECTED":
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-success/10 text-success";
      case "REJECTED":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-warning/10 text-warning";
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{documentName}</h4>
          <p className="text-sm text-muted-foreground">
            {projectCode} - {projectTitle}
          </p>
        </div>
        <Badge variant="outline" className="ml-2">
          {lifecycleStep}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Approval Mode:</span>
          <Badge variant={approvalMode === "SEQUENTIAL" ? "default" : "secondary"}>
            {approvalMode}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Approvers ({approvers.length}):</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{approvers.filter(a => a.status === "APPROVED").length} approved</span>
              <span>•</span>
              <span>{approvers.filter(a => a.status === "PENDING").length} pending</span>
              {approvers.filter(a => a.status === "REJECTED").length > 0 && (
                <>
                  <span>•</span>
                  <span>{approvers.filter(a => a.status === "REJECTED").length} rejected</span>
                </>
              )}
            </div>
          </div>
          <div className="space-y-1">
            {approvers.map((approver, index) => (
              <div key={approver.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`p-1 rounded-full ${getStatusColor(approver.status)}`}>
                    {getStatusIcon(approver.status)}
                  </div>
                  
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-brand-teal text-white text-xs">
                      {approver.initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{approver.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{approver.email}</p>
                    {approver.signedAt && (
                      <p className="text-xs text-muted-foreground">
                        {approver.status === "APPROVED" ? "Approved" : "Rejected"} on {new Date(approver.signedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {approvalMode === "SEQUENTIAL" && (
                    <Badge variant="outline" className="text-xs">
                      Step {index + 1}
                    </Badge>
                  )}
                  <Badge 
                    variant={approver.status === "APPROVED" ? "default" : 
                            approver.status === "REJECTED" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {approver.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {approvers.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No approvers configured</p>
          </div>
        )}
      </div>
    </Card>
  );
}