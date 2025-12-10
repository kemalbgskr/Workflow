import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, Clock } from "lucide-react";

interface Approver {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  signedAt?: string;
  initials: string;
}

interface ApproverAvatarsProps {
  approvers: Approver[];
  maxVisible?: number;
}

export default function ApproverAvatars({ approvers, maxVisible = 3 }: ApproverAvatarsProps) {
  const visibleApprovers = approvers.slice(0, maxVisible);
  const remainingCount = Math.max(0, approvers.length - maxVisible);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Check className="h-3 w-3 text-green-600" />;
      case "REJECTED":
        return <X className="h-3 w-3 text-red-600" />;
      default:
        return <Clock className="h-3 w-3 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "ring-green-500 bg-green-50";
      case "REJECTED":
        return "ring-red-500 bg-red-50";
      default:
        return "ring-yellow-500 bg-yellow-50";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Pending";
    return new Date(dateString).toLocaleString();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {visibleApprovers.map((approver) => (
          <Tooltip key={approver.id}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar className={`h-8 w-8 ring-2 ${getStatusColor(approver.status)} cursor-pointer`}>
                  <AvatarFallback className="text-xs font-medium">
                    {approver.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  {getStatusIcon(approver.status)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{approver.name}</p>
                <p className="text-sm text-muted-foreground">{approver.email}</p>
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(approver.status)}
                  <span className="font-medium">{getStatusText(approver.status)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(approver.signedAt)}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 ring-2 ring-gray-300 bg-gray-100 cursor-pointer">
                <AvatarFallback className="text-xs font-medium text-gray-600">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{remainingCount} more approver{remainingCount > 1 ? 's' : ''}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}