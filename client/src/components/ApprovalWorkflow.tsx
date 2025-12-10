import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Clock, X } from "lucide-react";

interface Approver {
  id: string;
  name: string;
  email: string;
  initials: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  orderIndex: number;
}

interface ApprovalWorkflowProps {
  approvers: Approver[];
  mode: "SEQUENTIAL" | "PARALLEL";
  size?: "sm" | "md";
}

export default function ApprovalWorkflow({ approvers, mode, size = "md" }: ApprovalWorkflowProps) {
  const avatarSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Check className={`${iconSize} text-green-600`} />;
      case "REJECTED":
        return <X className={`${iconSize} text-red-600`} />;
      default:
        return <Clock className={`${iconSize} text-yellow-600`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "border-green-500 bg-green-50";
      case "REJECTED":
        return "border-red-500 bg-red-50";
      default:
        return "border-yellow-500 bg-yellow-50";
    }
  };

  if (mode === "PARALLEL") {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {mode === "PARALLEL" ? "Parallel:" : "Sequential:"}
          </span>
          <div className="flex -space-x-2">
            {approvers.map((approver) => (
              <Tooltip key={approver.id}>
                <TooltipTrigger>
                  <div className="relative">
                    <Avatar className={`${avatarSize} border-2 ${getStatusColor(approver.status)}`}>
                      <AvatarFallback className="text-xs">
                        {approver.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      {getStatusIcon(approver.status)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-medium">{approver.name}</p>
                    <p className="text-muted-foreground">{approver.email}</p>
                    <p className="capitalize">{approver.status.toLowerCase()}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Sequential:
        </span>
        <div className="flex items-center">
          {approvers.map((approver, index) => (
            <div key={approver.id} className="flex items-center">
              <Tooltip>
                <TooltipTrigger>
                  <div className="relative">
                    <Avatar className={`${avatarSize} border-2 ${getStatusColor(approver.status)}`}>
                      <AvatarFallback className="text-xs">
                        {approver.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      {getStatusIcon(approver.status)}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-medium">{approver.name}</p>
                    <p className="text-muted-foreground">{approver.email}</p>
                    <p className="capitalize">{approver.status.toLowerCase()}</p>
                    <p className="text-xs">Step {approver.orderIndex + 1}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
              {index < approvers.length - 1 && (
                <div className="w-4 h-0.5 bg-gray-300 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}