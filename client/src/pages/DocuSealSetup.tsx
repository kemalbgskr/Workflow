import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileSignature, Users, Send, CheckCircle, ExternalLink } from "lucide-react";
import { type User } from "@shared/schema";

export default function DocuSealSetup() {
  const [, params] = useRoute("/documents/:documentId/docuseal-setup");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<User[]>([]);
  const [templateCreated, setTemplateCreated] = useState(false);
  const [templateEditUrl, setTemplateEditUrl] = useState("");
  const [envelopeId, setEnvelopeId] = useState("");

  const documentId = params?.documentId;

  useEffect(() => {
    if (documentId) {
      fetchDocument();
      fetchUsers();
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const doc = await response.json();
        setDocument(doc);
      }
    } catch (error) {
      console.error("Failed to fetch document:", error);
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

  const handleApproverToggle = (user: User) => {
    setSelectedApprovers(prev => {
      const exists = prev.find(a => a.id === user.id);
      if (exists) {
        return prev.filter(a => a.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateTemplate = async () => {
    if (selectedApprovers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one approver.",
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
          approvers: selectedApprovers.map(a => a.id),
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
        setLocation("/documents");
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

  if (!documentId) {
    return <div>Document not found</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/documents")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
        <div>
          <h1 className="text-2xl font-bold">DocuSeal Digital Signature Setup</h1>
          <p className="text-muted-foreground">Configure digital signature workflow for your document</p>
        </div>
      </div>

      {document && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Document Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Filename</p>
                <p className="text-sm text-muted-foreground">{document.filename}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground">{document.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant="outline">{document.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Lifecycle Step</p>
                <p className="text-sm text-muted-foreground">{document.lifecycleStep || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!templateCreated ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Approvers
            </CardTitle>
            <CardDescription>
              Choose who needs to digitally sign this document. They will receive email invitations from DocuSeal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {users.map((user) => {
                const isSelected = selectedApprovers.find(a => a.id === user.id);
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50 border-blue-200 dark:bg-blue-950" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => handleApproverToggle(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                      {isSelected && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedApprovers.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Selected Approvers ({selectedApprovers.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApprovers.map((approver) => (
                      <Badge key={approver.id} variant="outline">
                        {approver.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                📧 Approvers will receive email invitations to sign digitally
              </div>
              <Button
                onClick={handleCreateTemplate}
                disabled={loading || selectedApprovers.length === 0}
                className="flex items-center gap-2"
              >
                <FileSignature className="h-4 w-4" />
                {loading ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
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
              <h4 className="font-medium mb-2">Approvers ({selectedApprovers.length}):</h4>
              <div className="space-y-2">
                {selectedApprovers.map((approver, index) => (
                  <div key={approver.id} className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <span>{approver.name} ({approver.email})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setLocation("/documents")} variant="outline">
                Back to Documents
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
                <Send className="h-4 w-4" />
                {loading ? "Sending..." : "Send for Signing"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}