import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface ApproverCardProps {
  name: string;
  initials: string;
  email: string;
  role: string;
  orderIndex?: number;
  status: "PENDING" | "SIGNED" | "DECLINED" | "APPROVED" | "REJECTED";
  signedAt?: string;
  approvedAt?: string;
  sequential?: boolean;
  comment?: string;
}

export default function ApproverCard({
  name,
  initials,
  email,
  role,
  orderIndex,
  status,
  signedAt,
  approvedAt,
  sequential,
  comment,
}: ApproverCardProps) {
  const statusIcons = {
    PENDING: <Clock className="h-4 w-4 text-warning" />,
    SIGNED: <Check className="h-4 w-4 text-success" />,
    DECLINED: <X className="h-4 w-4 text-destructive" />,
    APPROVED: <Check className="h-4 w-4 text-success" />,
    REJECTED: <X className="h-4 w-4 text-destructive" />,
  };

  const displayStatus = status === 'APPROVED' ? 'SIGNED' : status === 'REJECTED' ? 'DECLINED' : status;
  const timestamp = approvedAt || signedAt;

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg border bg-card"
      data-testid={`card-approver-${email}`}
    >
      {sequential && orderIndex !== undefined && (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
          {orderIndex + 1}
        </div>
      )}

      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-brand-teal text-white">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{name}</p>
        <p className="text-sm text-muted-foreground truncate">{email}</p>
        {comment && (
          <p className="text-xs text-muted-foreground mt-1 truncate" title={comment}>
            Comment: {comment}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs">
          {role}
        </Badge>
        <div className="flex items-center gap-2">
          {statusIcons[status]}
          <StatusBadge status={displayStatus} />
        </div>
      </div>

      {timestamp && (status === "SIGNED" || status === "APPROVED" || status === "DECLINED" || status === "REJECTED") && (
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(timestamp).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}