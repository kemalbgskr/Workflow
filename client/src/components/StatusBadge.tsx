import { Badge } from "@/components/ui/badge";

type StatusType = 
  | "DRAFT" | "IN_REVIEW" | "SIGNING" | "SIGNED" | "REJECTED" | "APPROVED"
  | "PENDING" | "DECLINED"
  | "Initiative Submitted" | "Demand Prioritized" | "Initiative Approved"
  | "Kick Off" | "ARF" | "Deployment Preparation" | "RCB" | "Deployment" | "PTR" | "Go Live";

interface StatusBadgeProps {
  status: StatusType | undefined | null;
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

const statusConfig: Record<StatusType, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
  "DRAFT": { variant: "secondary", className: "bg-muted text-muted-foreground" },
  "IN_REVIEW": { variant: "default", className: "bg-info/20 text-info border-info/30" },
  "SIGNING": { variant: "default", className: "bg-warning/20 text-warning border-warning/30" },
  "SIGNED": { variant: "default", className: "bg-success/20 text-success border-success/30" },
  "REJECTED": { variant: "destructive", className: "bg-destructive/20 text-destructive border-destructive/30" },
  "APPROVED": { variant: "default", className: "bg-success/20 text-success border-success/30" },
  "PENDING": { variant: "default", className: "bg-warning/20 text-warning border-warning/30" },
  "DECLINED": { variant: "destructive", className: "bg-destructive/20 text-destructive border-destructive/30" },
  "Initiative Submitted": { variant: "default", className: "bg-info/20 text-info border-info/30" },
  "Demand Prioritized": { variant: "default", className: "bg-info/20 text-info border-info/30" },
  "Initiative Approved": { variant: "default", className: "bg-success/20 text-success border-success/30" },
  "Kick Off": { variant: "default", className: "bg-primary/20 text-primary border-primary/30" },
  "ARF": { variant: "default", className: "bg-primary/20 text-primary border-primary/30" },
  "Deployment Preparation": { variant: "default", className: "bg-warning/20 text-warning border-warning/30" },
  "RCB": { variant: "default", className: "bg-warning/20 text-warning border-warning/30" },
  "Deployment": { variant: "default", className: "bg-brand-orange/20 text-brand-orange border-brand-orange/30" },
  "PTR": { variant: "default", className: "bg-warning/20 text-warning border-warning/30" },
  "Go Live": { variant: "default", className: "bg-success/20 text-success border-success/30" },
};

export default function StatusBadge({ status, className = "", onClick, clickable = false }: StatusBadgeProps) {
  // Handle undefined or null status
  if (!status) {
    return (
      <Badge
        variant="secondary"
        className={`bg-muted text-muted-foreground ${className}`}
        data-testid="badge-status-unknown"
      >
        Unknown
      </Badge>
    );
  }

  const config = statusConfig[status] || { variant: "secondary" as const, className: "" };

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={clickable ? onClick : undefined}
      data-testid={`badge-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {status}
    </Badge>
  );
}