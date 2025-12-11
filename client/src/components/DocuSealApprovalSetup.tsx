import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, ArrowUp, ArrowDown, FileSignature, Workflow, ExternalLink, Loader2 } from "lucide-react";
import { type User } from "@shared/schema";
import { DocusealBuilder } from '@docuseal/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  const [showBuilder, setShowBuilder] = useState(false);
  const [builderToken, setBuilderToken] = useState<string>("");

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

  const handleLaunchBuilder = async () => {
    setLoading(true);
    try {
        const res = await fetch(`/api/documents/${documentId}/docuseal-token`, {
            method: 'POST'
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to get builder token: ${res.status} ${text.substring(0, 100)}`);
        }
        
        try {
            const data = await res.json();
            setBuilderToken(data.token);
            setShowBuilder(true);
        } catch (jsonError) {
            const text = await res.text().catch(() => "Unable to read text"); 
            // Note: Body might be used? res.json() consumes it. we need to clone.
            // But fetch body can typically only be read once.
            // If json() failed, we can't read text() again usually unless we cloned.
            // I'll clone the response first.
            throw new Error(`Invalid JSON response: ${jsonError}`);
        }
    } catch (error) {
        console.error("Builder launch error:", error);
        toast({
            title: "Error",
            description: "Failed to launch DocuSeal builder.",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  };

  const handleSendForSigning = async () => {
    // Logic to finalize (maybe call backend to map template to document if not already)
    // For now assuming template is saved in DocuSeal and we just need to trigger the send using that template? 
    // OR we trigger the send from Backend using the template associated with document.
    // We assume backend knows the template ID or we just need to save the "Approvers" first.
    
    // First save approvers to our DB
    try {
        setLoading(true);
        await fetch(`/api/documents/${documentId}/approvers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                approvers: approvalSteps.map(step => step.userId),
                approvalMode,
                approvalSteps: approvalSteps.map(step => ({
                    userId: step.userId,
                    order: step.order
                })),
                useDocuSeal: true // This might try to create template again? 
                // We should probably optimize backend to NOT re-create if it exists or handle this flow.
                // For now, let's just launch builder.
            }),
        });
        
        // Then trigger send
        const response = await fetch(`/api/documents/${documentId}/send-for-signing`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}), // no envelopeId needed if backend resolves it? or we skip?
        });

        if (response.ok) {
            toast({
                title: "Success",
                description: "Document sent for signing!",
            });
            onSuccess?.();
        }
    } catch (error) {
        console.error(error);
         toast({
            title: "Error",
            description: "Failed to send.",
            variant: "destructive"
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
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-6xl h-[90vh]">
            <DialogHeader>
                <DialogTitle>DocuSeal Builder</DialogTitle>
            </DialogHeader>
            <div className="h-full w-full bg-white rounded-md overflow-hidden">
                {builderToken && (
                    <DocusealBuilder 
                        token={builderToken} 
                        onSave={(data) => {
                            console.log("Template Saved:", data);
                            // We could save the template ID here if provided: data.slug or data.id
                        }}
                    />
                )}
            </div>
        </DialogContent>
      </Dialog>
      
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
              
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
            <Button 
              onClick={handleLaunchBuilder}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Form Builder
            </Button>
            <Button 
            onClick={handleSendForSigning} 
            disabled={loading || approvalSteps.length === 0}
            className="flex items-center gap-2"
            >
            <FileSignature className="h-4 w-4" />
            {loading ? "Sending..." : "Send for Signing"}
            </Button>
        </div>
      </div>
    </div>
  );
}