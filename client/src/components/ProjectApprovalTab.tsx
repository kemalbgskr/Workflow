import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Check, X, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProjectApprovalTabProps {
  projectId: string;
}

export default function ProjectApprovalTab({ projectId }: ProjectApprovalTabProps) {
  const { toast } = useToast();
  const [approvers, setApprovers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [approvalMode, setApprovalMode] = useState("SEQUENTIAL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApprovers();
    fetchUsers();
  }, [projectId]);

  const fetchApprovers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/approvers`);
      if (response.ok) {
        const data = await response.json();
        setApprovers(data);
        if (data.length > 0) {
          setApprovalMode(data[0].sequential ? "SEQUENTIAL" : "PARALLEL");
        }
      }
    } catch (error) {
      console.error('Failed to fetch approvers:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((u: any) => u.role === 'APPROVER' || u.role === 'ADMIN'));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSaveApprovers = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one approver",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/approvers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverIds: selectedUsers,
          mode: approvalMode
        })
      });

      if (response.ok) {
        await fetchApprovers();
        setSelectedUsers([]);
        toast({
          title: "Success",
          description: "Project approvers configured successfully"
        });
      } else {
        throw new Error('Failed to configure approvers');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to configure approvers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Check className="h-4 w-4 text-success" />;
      case "REJECTED":
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-success/10 text-success";
      case "REJECTED":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-warning/10 text-warning";
    }
  };

  return (
    <div className="space-y-6">
      {/* Configure Approvers Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Configure Project Approvers</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Approval Mode</label>
            <Select value={approvalMode} onValueChange={setApprovalMode}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEQUENTIAL">Sequential</SelectItem>
                <SelectItem value="PARALLEL">Parallel</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {approvalMode === "SEQUENTIAL" 
                ? "Approvers must approve in order" 
                : "All approvers can approve simultaneously"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Approvers</label>
            <Select 
              value="" 
              onValueChange={(userId) => {
                if (!selectedUsers.includes(userId)) {
                  setSelectedUsers([...selectedUsers, userId]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add approver..." />
              </SelectTrigger>
              <SelectContent>
                {users
                  .filter(user => !selectedUsers.includes(user.id))
                  .map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Approvers:</label>
              <div className="space-y-2">
                {selectedUsers.map((userId, index) => {
                  const user = users.find(u => u.id === userId);
                  if (!user) return null;
                  
                  return (
                    <div key={userId} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-brand-teal text-white text-xs">
                          {user.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      {approvalMode === "SEQUENTIAL" && (
                        <Badge variant="outline" className="text-xs">
                          Step {index + 1}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button 
            onClick={handleSaveApprovers} 
            disabled={loading || selectedUsers.length === 0}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Approvers"}
          </Button>
        </div>
      </Card>

      {/* Current Approvers Section */}
      {approvers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Current Approvers</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Mode:</span>
              <Badge variant={approvers[0]?.sequential ? "default" : "secondary"}>
                {approvers[0]?.sequential ? "Sequential" : "Parallel"}
              </Badge>
            </div>

            <div className="space-y-2">
              {approvers.map((approver, index) => (
                <div key={approver.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`p-1 rounded-full ${getStatusColor(approver.status)}`}>
                    {getStatusIcon(approver.status)}
                  </div>
                  
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-brand-teal text-white text-xs">
                      {approver.initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">{approver.name}</p>
                    <p className="text-xs text-muted-foreground">{approver.email}</p>
                    {approver.comment && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Comment: {approver.comment}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {approvers[0]?.sequential && (
                      <Badge variant="outline" className="text-xs">
                        Step {index + 1}
                      </Badge>
                    )}
                    <Badge 
                      variant={approver.status === "APPROVED" ? "default" : 
                              approver.status === "REJECTED" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {approver.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}