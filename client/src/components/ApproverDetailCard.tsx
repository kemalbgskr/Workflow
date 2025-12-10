import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, FileText, ArrowRight, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ApproverDetailCardProps {
  approver: {
    id: string;
    email: string;
    name?: string;
    orderIndex: number;
    mode: string;
  };
  projectId: string;
  currentStatus?: string;
  targetStatus?: string;
  onDelete?: () => void;
}

interface ApprovalItem {
  id: string;
  documentName: string;
  documentType: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedAt?: string;
  comment?: string;
}

export default function ApproverDetailCard({ approver, projectId, currentStatus, targetStatus, onDelete }: ApproverDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const { canManageUsers } = useAuth();
  
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove ${approver.name || approver.email} as an approver?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/approvers/${approver.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Approver Removed",
          description: "Approver has been removed successfully."
        });
        onDelete?.();
      } else {
        throw new Error('Failed to delete approver');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove approver.",
        variant: "destructive"
      });
    }
  };
  
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
    "Go Live"
  ];
  const { data: approvalHistory = [], isLoading } = useQuery<any[]>({
    queryKey: ['approver-lifecycle', approver.id, projectId],
    queryFn: async () => {
      const response = await fetch(`/api/approvers/${approver.id}/lifecycle?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch approver lifecycle');
      }
      return response.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 30000
  });

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getLifecycleStatus = (statusName: string) => {
    const history = approvalHistory.find(h => h.status === statusName);
    if (history) {
      return history.approvalStatus; // 'APPROVED', 'REJECTED', 'PENDING'
    }
    return 'NOT_REACHED';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-300" />;
    }
  };

  const approvedCount = sdlcStatuses.filter(s => getLifecycleStatus(s) === 'APPROVED').length;
  const pendingCount = sdlcStatuses.filter(s => getLifecycleStatus(s) === 'PENDING').length;
  const rejectedCount = sdlcStatuses.filter(s => getLifecycleStatus(s) === 'REJECTED').length;

  return (
    <Card>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-brand-teal text-white text-sm">
                {getInitials(approver.email, approver.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {approver.name || approver.email.split('@')[0]}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{approver.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-semibold text-green-600">{approvedCount}</div>
                <div className="text-muted-foreground">✓</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{pendingCount}</div>
                <div className="text-muted-foreground">⏳</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600">{rejectedCount}</div>
                <div className="text-muted-foreground">✗</div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {approver.mode}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
        {/* Status Change Request */}
        {targetStatus && targetStatus !== currentStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
              <ArrowRight className="w-4 h-4" />
              Status Change Request
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <span>{currentStatus}</span>
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium bg-blue-100 px-2 py-1 rounded">{targetStatus}</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">Approval required for this status change</div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{approvedCount}</div>
            <div className="text-xs text-muted-foreground">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{rejectedCount}</div>
            <div className="text-xs text-muted-foreground">Rejected</div>
          </div>
        </div>

        {/* SDLC Lifecycle Status */}
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading lifecycle status...
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">SDLC Lifecycle Status:</h4>
            <div className="space-y-1">
              {sdlcStatuses.map((statusName, index) => {
                const status = getLifecycleStatus(statusName);
                const isTarget = targetStatus === statusName;
                return (
                  <div 
                    key={statusName} 
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      isTarget ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground w-4">{index + 1}</div>
                      <div>
                        <p className={`text-sm ${isTarget ? 'font-medium text-blue-800' : ''}`}>
                          {statusName}
                          {isTarget && <span className="ml-2 text-xs bg-blue-100 px-1 py-0.5 rounded">TARGET</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className={`text-xs ${
                        status === 'APPROVED' ? 'text-green-600' :
                        status === 'REJECTED' ? 'text-red-600' :
                        status === 'PENDING' ? 'text-yellow-600' :
                        'text-gray-400'
                      }`}>
                        {status === 'NOT_REACHED' ? 'Not Reached' : status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {approvalHistory.some(item => item.approvedAt) && (
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Activity:</h4>
            {approvalHistory
              .filter(item => item.approvedAt)
              .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime())
              .slice(0, 2)
              .map((item) => (
                <div key={`activity-${item.status}`} className="text-xs text-muted-foreground">
                  {item.approvalStatus === 'APPROVED' ? 'Approved' : 'Rejected'} "{item.status}" 
                  {item.approvedAt && ` on ${new Date(item.approvedAt).toLocaleDateString()}`}
                  {item.comment && (
                    <div className="text-xs italic mt-1 pl-2 border-l-2 border-muted">
                      "{item.comment}"
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
        </CardContent>
      )}
    </Card>
  );
}