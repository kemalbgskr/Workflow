import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, ArrowUp, ArrowDown, FileSignature, Workflow, ExternalLink } from "lucide-react";
import { type User } from "@shared/schema";

interface ApprovalStep {
  id: string;
  userId: string;
  user?: User;
  order: number;
}

interface DocuSealApprovalSetupProps {
  documentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DocuSealApprovalSetup({ documentId, onSuccess, onCancel }: DocuSealApprovalSetupProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [approvalMode, setApprovalMode] = useState<"SEQUENTIAL" | "PARALLEL">("SEQUENTIAL");
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [templateCreated, setTemplateCreated] = useState(false);
  const [templateEditUrl, setTemplateEditUrl] = useState("");
  const [envelopeId, setEnvelopeId] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleCreateTemplate = async () => {
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
      const response = await fetch(`/api/documents/${documentId}/approvers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approvers: approvalSteps.map(step => step.userId),
          approvalMode,
          approvalSteps: approvalSteps.map(step => ({
            userId: step.userId,
            order: step.order
          })),
          useDocuSeal: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTemplateCreated(true);
        setTemplateEditUrl(result.envelope?.docusealEditUrl || "");
        setEnvelopeId(result.envelope?.id || "");
        
        toast({
          title: "DocuSeal Template Created",
          description: "Template has been created. You can now edit the signature fields.",
        });
      } else {
        throw new Error("Failed to create template");
      }
    } catch (error) {
      console.error("Create template error:", error);
      toast({
        title: "Error",
        description: "Failed to create DocuSeal template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendForSigning = async () => {
    if (!envelopeId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/send-for-signing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ envelopeId }),
      });

      if (response.ok) {
        toast({
          title: "Document Sent for Signing",
          description: "Signature requests have been sent to all approvers.",
        });
        onSuccess?.();
      } else {
        throw new Error("Failed to send for signing");
      }
    } catch (error) {
      console.error("Send for signing error:", error);
      toast({
        title: "Error",
        description: "Failed to send document for signing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = users.filter(user => 
    !approvalSteps.find(step => step.userId === user.id)
  );

  if (templateCreated) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <FileSignature className="h-5 w-5" />
              Template Created Successfully
            </CardTitle>
            <CardDescription>
              Your document template has been created in DocuSeal. Now you can set up signature fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Next Steps:
              </h4>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Click "Edit Template" to set up signature fields in DocuSeal</li>
                <li>Position signature fields for each approver</li>
                <li>Save the template in DocuSeal</li>
                <li>Return here and click "Send for Signing"</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">Approvers ({approvalSteps.length}):</h4>
              <div className="space-y-2">
                {approvalSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <span>{step.user?.name} ({step.user?.email})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={onCancel} variant="outline">
                Close
              </Button>
              {templateEditUrl && (
                <Button 
                  onClick={() => window.open(templateEditUrl, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Edit Template in DocuSeal
                </Button>
              )}
              <Button 
                onClick={handleSendForSigning}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <FileSignature className="h-4 w-4" />
                {loading ? "Sending..." : "Send for Signing"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <RadioGroup value={approvalMode} onValueChange={(value) => setApprovalMode(value as "SEQUENTIAL" | "PARALLEL")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="SEQUENTIAL" id="sequential" />
              <Label htmlFor="sequential" className="flex-1">
                <div>
                  <p className="font-medium">Sequential Approval</p>
                  <p className="text-sm text-muted-foreground">Approvers must sign in order, one after another</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PARALLEL" id="parallel" />
              <Label htmlFor="parallel" className="flex-1">
                <div>
                  <p className="font-medium">Parallel Approval</p>
                  <p className="text-sm text-muted-foreground">All approvers can sign simultaneously</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Add Approvers
          </CardTitle>
          <CardDescription>
            Select approvers who will digitally sign this document
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
                            {user.name.split(' ').map(n => n[0]).join('')}
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
            <Button onClick={addApprover} disabled={!selectedUserId}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {approvalSteps.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Signature Sequence ({approvalSteps.length} approvers)</h4>
              <div className="space-y-2">
                {approvalSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-medium text-sm">
                      {step.order}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{step.user?.name}</span>
                        <Badge variant={step.user?.role === "ADMIN" ? "default" : "secondary"}>
                          {step.user?.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.user?.email}</p>
                    </div>

                    {approvalMode === "SEQUENTIAL" && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveApprover(step.id, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveApprover(step.id, "down")}
                          disabled={index === approvalSteps.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeApprover(step.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {approvalMode === "SEQUENTIAL" && (
                <div className="text-sm text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950 rounded border">
                  📋 Approvers will sign in the order shown above. Each approver must complete their signature before the next one can start.
                </div>
              )}
              
              {approvalMode === "PARALLEL" && (
                <div className="text-sm text-muted-foreground p-2 bg-green-50 dark:bg-green-950 rounded border">
                  🔄 All approvers will receive notifications simultaneously and can sign in any order.
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground p-2 bg-yellow-50 dark:bg-yellow-950 rounded border">
            📧 Approvers will receive email invitations to sign the document digitally via DocuSeal.
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateTemplate} 
          disabled={loading || approvalSteps.length === 0}
          className="flex items-center gap-2"
        >
          <FileSignature className="h-4 w-4" />
          {loading ? "Creating..." : "Create Template"}
        </Button>
      </div>
    </div>
  );
}