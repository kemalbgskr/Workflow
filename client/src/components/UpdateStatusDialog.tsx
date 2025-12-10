import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type StatusType = 
  | "DRAFT" | "IN_REVIEW" | "SIGNING" | "SIGNED" | "REJECTED"
  | "PENDING" | "DECLINED"
  | "Initiative Submitted" | "Demand Prioritized" | "Initiative Approved"
  | "Kick Off" | "ARF" | "Deployment Preparation" | "RCB" | "Deployment" | "PTR" | "Go Live";

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currentStatus: StatusType;
}

const statusOptions: StatusType[] = [
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

export default function UpdateStatusDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  currentStatus 
}: UpdateStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusType>(currentStatus);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: StatusType) => {
      return api.updateProjectStatus(projectId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onOpenChange(false);
    }
  });

  const handleSubmit = () => {
    if (selectedStatus !== currentStatus) {
      updateStatusMutation.mutate(selectedStatus);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Project Status</DialogTitle>
          <DialogDescription>
            Change the current status of this project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Current Status</label>
            <div className="mt-1 p-2 bg-muted rounded text-sm">{currentStatus}</div>
          </div>
          <div>
            <label className="text-sm font-medium">New Status</label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as StatusType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}