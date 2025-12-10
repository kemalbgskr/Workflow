import { Button } from "@/components/ui/button";
import { FileText, Download, Settings, Eye, Trash2, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "./StatusBadge";
import ApprovalWorkflow from "./ApprovalWorkflow";
import ApproverAvatars from "./ApproverAvatars";
import { useState, useEffect } from "react";

interface DocumentRowProps {
  id: string;
  filename: string;
  type: "FS" | "BRD" | "PROJECT_CHARTER" | "ARF" | "FSD";
  version: number;
  status: "DRAFT" | "IN_REVIEW" | "SIGNING" | "SIGNED" | "REJECTED" | "APPROVED";
  uploadedBy: string;
  uploadedAt: string;
  onView?: () => void;
  onConfigure?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onCheckCompletion?: () => void;
}

const typeLabels = {
  FS: "Feasibility Study",
  BRD: "Business Requirements",
  PROJECT_CHARTER: "Project Charter",
  ARF: "ARF Form",
  FSD: "Functional Spec",
};

export default function DocumentRow({
  id,
  filename,
  type,
  version,
  status,
  uploadedBy,
  uploadedAt,
  onView,
  onConfigure,
  onDownload,
  onDelete,
  onApprove,
  onReject,
  onCheckCompletion,
}: DocumentRowProps) {
  const [approvers, setApprovers] = useState([]);
  const [approvalMode, setApprovalMode] = useState("SEQUENTIAL");
  

  
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        const response = await fetch(`/api/documents/${id}/approvers`);
        if (response.ok) {
          const data = await response.json();
          setApprovers(data);
        }
      } catch (error) {
        console.error('Failed to fetch approvers:', error);
      }
    };
    
    const fetchApprovalMode = async () => {
      try {
        const response = await fetch(`/api/documents/${id}/approval-mode`);
        if (response.ok) {
          const data = await response.json();
          if (data.mode) {
            setApprovalMode(data.mode);
          }
        }
      } catch (error) {
        console.error('Failed to fetch approval mode:', error);
      }
    };
    
    if (status === "IN_REVIEW" || status === "SIGNING" || status === "SIGNED" || status === "APPROVED" || status === "REJECTED") {
      fetchApprovers();
      fetchApprovalMode();
    }
  }, [id, status]);
  

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate"
      data-testid={`row-document-${id}`}
    >
      <div className="p-2 bg-primary/10 rounded-lg">
        <FileText className="h-5 w-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate" data-testid={`text-document-name-${id}`}>{filename}</p>
          <span className="text-xs text-muted-foreground">v{version}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>{typeLabels[type]}</span>
          <span>•</span>
          <span>{uploadedBy}</span>
          <span>•</span>
          <span>{uploadedAt}</span>
        </div>
        {approvers.length > 0 && (
          <div className="mt-2">
            {(status === "APPROVED" || status === "REJECTED" || status === "SIGNED") ? (
              <ApproverAvatars approvers={approvers} maxVisible={4} />
            ) : (
              <ApprovalWorkflow 
                key={`${id}-${approvalMode}`}
                approvers={approvers} 
                mode={approvalMode as "SEQUENTIAL" | "PARALLEL"}
                size="sm"
              />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={status} />

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onView}
            data-testid={`button-view-document-${id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                data-testid={`button-configure-document-${id}`}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onConfigure && (
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    onConfigure();
                  }} 
                  disabled={status === "SIGNED"}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Configure Approvers
                </DropdownMenuItem>
              )}

              {status === "IN_REVIEW" && (
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    onCheckCompletion && onCheckCompletion();
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Check Completion
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onSelect={(e) => {
                  e.preventDefault();
                  onDownload && onDownload();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    console.log('Delete from dropdown');
                    onDelete();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Document
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}