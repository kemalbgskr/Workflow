import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, ArrowUp, ArrowDown, Users, Workflow } from "lucide-react";
import { type User } from "@shared/schema";

interface ApprovalStep {
  id: string;
  userId: string;
  user?: User;
  order: number;
}

interface StandardApprovalSetupProps {
  documentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function StandardApprovalSetup({ documentId, onSuccess, onCancel }: StandardApprovalSetupProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [approvalMode, setApprovalMode] = useState<"SEQUENTIAL" | "PARALLEL">("SEQUENTIAL");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [existingApprovers, setExistingApprovers] = useState<any[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [canEditMode, setCanEditMode] = useState(true);
  const [documentStatus, setDocumentStatus] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchExistingApprovers();
    fetchDocumentStatus();
  }, [documentId]);

  const fetchExistingApprovers = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/approvers`);
      if (response.ok) {
        const data = await response.json();
        setExistingApprovers(data);
        
        // Check if any approver has started approving
        const hasStartedApproving = data.some((approver: any) => approver.status !== "PENDING");
        setCanEdit(!hasStartedApproving);
        
        // If approvers exist, mode cannot be changed (only new approvers can be added)
        const hasExistingApprovers = data.length > 0;
        setCanEditMode(!hasExistingApprovers);
        
        // Load existing approval steps
        if (data.length > 0) {
          const steps = data.map((approver: any, index: number) => ({
            id: approver.id,
            userId: approver.userId || approver.id,
            user: {
              id: approver.userId || approver.id,
              name: approver.name || approver.userName,
              email: approver.email,
              role: "APPROVER"
            },
            order: approver.orderIndex + 1
          }));
          setApprovalSteps(steps);
        }
        
        // Always fetch approval mode if document has approval rounds
        fetchApprovalMode();
      }
    } catch (error) {
      console.error("Failed to fetch existing approvers:", error);
    }
  };
  
  const fetchApprovalMode = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/approval-mode`);
      if (response.ok) {
        const data = await response.json();
        setApprovalMode(data.mode);
      }
    } catch (error) {
      console.error("Failed to fetch approval mode:", error);
    }
  };

  const fetchDocumentStatus = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocumentStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to fetch document status:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((user: User) => user.role === "APPROVER" || user.role === "ADMIN"));
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const addApprover = () => {
    if (!selectedUserId) {
      toast({
        title: "Validation Error",
        description: "Please select an approver.",
        variant: "destructive",
      });
      return;
    }

    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;

    // Check if user is already added
    if (approvalSteps.find(step => step.userId === selectedUserId)) {
      toast({
        title: "Validation Error",
        description: "This approver is already added.",
        variant: "destructive",
      });
      return;
    }

    const newStep: ApprovalStep = {
      id: crypto.randomUUID(),
      userId: selectedUserId,
      user,
      order: approvalSteps.length + 1
    };

    setApprovalSteps(prev => [...prev, newStep]);
    setSelectedUserId("");
  };

  const removeApprover = (stepId: string) => {
    setApprovalSteps(prev => {
      const filtered = prev.filter(step => step.id !== stepId);
      // Reorder remaining steps
      return filtered.map((step, index) => ({
        ...step,
        order: index + 1
      }));
    });
  };

  const moveApprover = (stepId: string, direction: "up" | "down") => {
    setApprovalSteps(prev => {
      const steps = [...prev];
      const currentIndex = steps.findIndex(step => step.id === stepId);
      
      if (currentIndex === -1) return steps;
      
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= steps.length) return steps;
      
      // Swap positions
      [steps[currentIndex], steps[newIndex]] = [steps[newIndex], steps[currentIndex]];
      
      // Update order numbers
      return steps.map((step, index) => ({
        ...step,
        order: index + 1
      }));
    });
  };

  const handleSubmit = async () => {
    if (approvalSteps.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one approver.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        approvers: approvalSteps.map(step => step.userId),
        approvalMode,
        priority,
        approvalSteps: approvalSteps.map(step => ({
          userId: step.userId,
          order: step.order
        })),
        useDocuSeal: false
      };
      
      const response = await fetch(`/api/documents/${documentId}/approvers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast({
          title: "Approval Workflow Configured",
          description: `${approvalMode.toLowerCase()} approval workflow has been set up successfully.`,
        });
        onSuccess?.();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server response:', response.status, errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error("Configure approval error:", error);
      toast({
        title: "Error",
        description: (error as any).message || "Failed to configure approval workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = users.filter(user => 
    !approvalSteps.find(step => step.userId === user.id)
  );

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Approval process has started. Cannot modify approvers.
          </p>
        </div>
      )}
      
      {!canEditMode && canEdit && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ Approval mode is already set. You can only add new approvers to the existing workflow.
          </p>
        </div>
      )}
      
      {documentStatus && documentStatus !== "DRAFT" && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📄 Document Status: <strong>{documentStatus}</strong>
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Approval Mode
            </CardTitle>
            <CardDescription>
              Choose how approvers should review the document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={approvalMode} 
              onValueChange={(value) => setApprovalMode(value as "SEQUENTIAL" | "PARALLEL")}
              disabled={!canEditMode}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SEQUENTIAL" id="sequential" disabled={!canEditMode} />
                <Label htmlFor="sequential" className="flex-1">
                  <div>
                    <p className="font-medium">Sequential Approval</p>
                    <p className="text-sm text-muted-foreground">Approvers must review in order, one after another</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PARALLEL" id="parallel" disabled={!canEditMode} />
                <Label htmlFor="parallel" className="flex-1">
                  <div>
                    <p className="font-medium">Parallel Approval</p>
                    <p className="text-sm text-muted-foreground">All approvers can review simultaneously</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Level</CardTitle>
            <CardDescription>
              Set the urgency level for this approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={priority} onValueChange={(value) => setPriority(value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">🟢 Low Priority</SelectItem>
                <SelectItem value="MEDIUM">🟡 Medium Priority</SelectItem>
                <SelectItem value="HIGH">🟠 High Priority</SelectItem>
                <SelectItem value="CRITICAL">🔴 Critical Priority</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add Approvers
          </CardTitle>
          <CardDescription>
            Select approvers and set their review order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an approver..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {user.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{user.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({user.email})</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addApprover} disabled={!selectedUserId || !canEdit}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {approvalSteps.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Approval Sequence ({approvalSteps.length} approvers)</h4>
              <div className="space-y-2">
                {approvalSteps.map((step, index) => {
                  const existingApprover = existingApprovers.find(a => a.email === step.user?.email);
                  const approverStatus = existingApprover?.status || "PENDING";
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg ${
                        approverStatus === "APPROVED" ? "bg-green-50 dark:bg-green-950 border-green-200" :
                        approverStatus === "REJECTED" ? "bg-red-50 dark:bg-red-950 border-red-200" :
                        "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${
                        approverStatus === "APPROVED" ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400" :
                        approverStatus === "REJECTED" ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400" :
                        "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                      }`}>
                        {step.order}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{step.user?.name}</span>
                          <Badge variant={step.user?.role === "ADMIN" ? "default" : "secondary"}>
                            {step.user?.role}
                          </Badge>
                          {existingApprover && (
                            <Badge variant={
                              approverStatus === "APPROVED" ? "default" :
                              approverStatus === "REJECTED" ? "destructive" :
                              "secondary"
                            }>
                              {approverStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{step.user?.email}</p>
                      </div>

                    {approvalMode === "SEQUENTIAL" && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveApprover(step.id, "up")}
                          disabled={index === 0 || !canEdit}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveApprover(step.id, "down")}
                          disabled={index === approvalSteps.length - 1 || !canEdit}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeApprover(step.id)}
                      disabled={!canEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  );
                })}
              </div>
              
              {approvalMode === "SEQUENTIAL" && (
                <div className="text-sm text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950 rounded border">
                  📋 Approvers will review in the order shown above. Each approver must complete their review before the next one can start.
                </div>
              )}
              
              {approvalMode === "PARALLEL" && (
                <div className="text-sm text-muted-foreground p-2 bg-green-50 dark:bg-green-950 rounded border">
                  🔄 All approvers will receive notifications simultaneously and can review in any order.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || approvalSteps.length === 0 || !canEdit}
        >
          {loading ? "Configuring..." : 
           !canEdit ? "View Only" :
           !canEditMode ? "Add Approvers" : 
           "Configure Approval Workflow"}
        </Button>
      </div>
    </div>
  );
}