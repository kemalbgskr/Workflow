import { Button } from "@/components/ui/button";
import { FileText, Download, Send, Settings, Eye } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface DocumentRowProps {
  id: string;
  filename: string;
  type: "FS" | "BRD" | "PROJECT_CHARTER" | "ARF" | "FSD";
  version: number;
  status: "DRAFT" | "IN_REVIEW" | "SIGNING" | "SIGNED" | "REJECTED";
  uploadedBy: string;
  uploadedAt: string;
  onView?: () => void;
  onConfigure?: () => void;
  onSend?: () => void;
  onDownload?: () => void;
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
  onSend,
  onDownload,
}: DocumentRowProps) {
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{typeLabels[type]}</span>
          <span>•</span>
          <span>{uploadedBy}</span>
          <span>•</span>
          <span>{uploadedAt}</span>
        </div>
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
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onConfigure}
            data-testid={`button-configure-document-${id}`}
            disabled={status === "SIGNED"}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onSend}
            data-testid={`button-send-document-${id}`}
            disabled={status === "SIGNING" || status === "SIGNED"}
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onDownload}
            data-testid={`button-download-document-${id}`}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
