import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ApprovalStageCard from "@/components/ApprovalStageCard";

interface DocumentApprovalCardProps {
  approval: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function DocumentApprovalCard({ 
  approval, 
  isExpanded, 
  onToggleExpand, 
  onApprove, 
  onReject 
}: DocumentApprovalCardProps) {
  return (
    <Card className="hover-elevate border-l-4 border-l-blue-500" data-testid={`card-document-approval-${approval.id}`}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    Document Review
                  </Badge>
                  {approval.mustSign && (
                    <Badge variant="destructive" className="text-xs">
                      Signature Required
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold truncate text-lg">{approval.documentName}</h3>
                <p className="text-sm text-muted-foreground">
                  {approval.projectCode} - {approval.projectTitle}
                </p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {approval.documentType} v{approval.documentVersion}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {approval.lifecycleStep}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {approval.approvalMode} Mode
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={approval.priority === "High" ? "destructive" : approval.priority === "Medium" ? "default" : "outline"}>
                  {approval.priority}
                </Badge>
                <StatusBadge status={approval.status || "PENDING"} />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-brand-teal text-white text-xs">
                    {approval.requester?.initials || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {approval.requester?.name || 'Unknown User'}
                  </span>
                  {approval.requester?.department && (
                    <span className="text-xs text-muted-foreground">
                      {approval.requester.department}
                    </span>
                  )}
                </div>
              </div>
              
              <span className="text-sm text-muted-foreground">
                Submitted: {new Date(approval.submittedAt).toLocaleDateString()}
              </span>
              
              <span className="text-sm text-muted-foreground">
                Due: {approval.dueDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button 
              size="sm" 
              variant="default"
              onClick={onApprove}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={onReject}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-6 pb-6 pt-0">
          <div className="border-t pt-4 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-3">Document Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Document Type:</span>
                  <span className="ml-2 font-medium">{approval.documentType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <span className="ml-2 font-medium">v{approval.documentVersion}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Lifecycle Step:</span>
                  <span className="ml-2 font-medium">{approval.lifecycleStep}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Approval Mode:</span>
                  <span className="ml-2 font-medium">{approval.approvalMode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Signature Required:</span>
                  <span className="ml-2 font-medium">{approval.mustSign ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="ml-2 font-medium">{approval.priority}</span>
                </div>
              </div>
            </div>
            
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
  );
}