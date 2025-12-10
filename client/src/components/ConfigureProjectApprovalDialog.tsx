import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Redirect } from "wouter";

interface ConfigureProjectApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export default function ConfigureProjectApprovalDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: ConfigureProjectApprovalDialogProps) {
  const { toast } = useToast();
  const { canConfigureApprovers } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [approvalMode, setApprovalMode] = useState("SEQUENTIAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Don't render the dialog content if user doesn't have permission
  const hasPermission = canConfigureApprovers();

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        const approvers = data.filter((user: any) => user.role === 'APPROVER' || user.role === 'ADMIN');
        setUsers(approvers);
        setAvailableUsers(approvers);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleAddApprover = (userId: string) => {
    if (!selectedApprovers.includes(userId)) {
      setSelectedApprovers(prev => [...prev, userId]);
    }
  };

  const handleRemoveApprover = (userId: string) => {
    setSelectedApprovers(prev => prev.filter(id => id !== userId));
  };

  const getSelectedUsers = () => {
    return users.filter(user => selectedApprovers.includes(user.id));
  };

  const getAvailableUsers = () => {
    return users.filter(user => !selectedApprovers.includes(user.id));
  };

  const handleSubmit = async () => {
    if (selectedApprovers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one approver",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/approvers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverIds: selectedApprovers,
          mode: approvalMode,
          priority: priority
        })
      });

      if (response.ok) {
        console.log('Project approvers configured successfully');
        toast({
          title: "Success",
          description: "Project approvers configured successfully",
        });
        console.log('Calling onSuccess callback');
        onSuccess?.();
        onOpenChange(false);
        setSelectedApprovers([]);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to configure approvers:', response.status, errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to configure approvers');
      }
    } catch (error) {
      console.error('Configure approvers error:', error);
      toast({
        title: "Error",
        description: (error as any).message || "Failed to configure project approvers",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open && hasPermission} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Project Approvers</DialogTitle>
          <DialogDescription>Select approvers and configure approval workflow for this project</DialogDescription>
        </DialogHeader>
        
        {!hasPermission ? (
          <div className="p-4 text-center">
            <p className="text-muted-foreground">You don't have permission to configure approvers.</p>
          </div>
        ) : (
          <div className="space-y-4">
          <div className="space-y-2">
            <Label>Approval Mode</Label>
            <Select value={approvalMode} onValueChange={setApprovalMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEQUENTIAL">Sequential (One by one)</SelectItem>
                <SelectItem value="PARALLEL">Parallel (All at once)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">🟢 Low</SelectItem>
                <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                <SelectItem value="HIGH">🟠 High</SelectItem>
                <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Add Approver</Label>
            <Select onValueChange={handleAddApprover}>
              <SelectTrigger>
                <SelectValue placeholder="Select an approver to add" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableUsers().map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email} • {user.department}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedApprovers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Approvers ({selectedApprovers.length})</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {getSelectedUsers().map((user: any, index) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveApprover(user.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Configuring...' : 'Configure Approvers'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}