import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewInitiativeWizardProps {
  onComplete?: (projectId: string) => void;
  onCancel?: () => void;
}

interface ProjectData {
  title: string;
  description: string;
  type: "Project" | "Non-Project";
  category: string;
  methodology: "Waterfall" | "Agile";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface DocumentFile {
  file: File;
  type: "FS" | "BRD";
  uploaded: boolean;
}

export default function NewInitiativeWizard({ onComplete, onCancel }: NewInitiativeWizardProps) {
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectData>({
    title: "",
    description: "",
    type: "Project",
    category: "",
    methodology: "Waterfall",
    priority: "MEDIUM"
  });
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (type: "FS" | "BRD", file: File) => {
    if (!file.type.includes("pdf")) {
      toast({
        title: "Invalid File Type",
        description: "Only PDF files are allowed",
        variant: "destructive"
      });
      return;
    }

    setDocuments(prev => {
      const filtered = prev.filter(doc => doc.type !== type);
      return [...filtered, { file, type, uploaded: false }];
    });
  };

  const removeDocument = (type: "FS" | "BRD") => {
    setDocuments(prev => prev.filter(doc => doc.type !== type));
  };

  const uploadDocuments = async (projectId: string) => {
    for (const doc of documents) {
      const formData = new FormData();
      formData.append("file", doc.file);
      formData.append("projectId", projectId);
      formData.append("lifecycleStep", "Initiative");
      formData.append("documentType", doc.type);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${doc.type}`);
      }

      doc.uploaded = true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Create project
      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData)
      });

      if (!projectResponse.ok) {
        throw new Error("Failed to create project");
      }

      const project = await projectResponse.json();

      // Upload documents
      if (documents.length > 0) {
        await uploadDocuments(project.id);
      }

      toast({
        title: "Initiative Created Successfully",
        description: "Your SDLC initiative has been submitted for review"
      });

      onComplete?.(project.id);
    } catch (error) {
      toast({
        title: "Error Creating Initiative",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = projectData.title && projectData.type && projectData.methodology;
  const canSubmit = canProceedToStep2 && documents.length >= 2;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">New SDLC Initiative</h2>
          <Badge variant="outline">Step {step} of 2</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-brand-teal text-white' : 'bg-muted'}`}>
            {step > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
          </div>
          <div className={`flex-1 h-1 ${step > 1 ? 'bg-brand-teal' : 'bg-muted'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-brand-teal text-white' : 'bg-muted'}`}>
            2
          </div>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Provide basic information about your SDLC initiative
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={projectData.title}
                onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter project title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={projectData.description}
                onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the project"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project Type *</Label>
                <Select
                  value={projectData.type}
                  onValueChange={(value: "Project" | "Non-Project") => 
                    setProjectData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Non-Project">Non-Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Methodology *</Label>
                <Select
                  value={projectData.methodology}
                  onValueChange={(value: "Waterfall" | "Agile") => 
                    setProjectData(prev => ({ ...prev, methodology: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Waterfall">Waterfall</SelectItem>
                    <SelectItem value="Agile">Agile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Priority *</Label>
              <Select
                value={projectData.priority}
                onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => 
                  setProjectData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">🟢 Low Priority</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Medium Priority</SelectItem>
                  <SelectItem value="HIGH">🟠 High Priority</SelectItem>
                  <SelectItem value="CRITICAL">🔴 Critical Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={projectData.category}
                onChange={(e) => setProjectData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Digital Banking, Core System"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>
              Upload Feasibility Study (FS) and Business Requirements Document (BRD)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {["FS", "BRD"].map((docType) => {
              const doc = documents.find(d => d.type === docType);
              return (
                <div key={docType} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">
                      {docType === "FS" ? "Feasibility Study" : "Business Requirements Document"}
                    </h4>
                    <Badge variant={doc ? "default" : "secondary"}>
                      {doc ? "Uploaded" : "Required"}
                    </Badge>
                  </div>
                  
                  {doc ? (
                    <div className="flex items-center justify-between bg-muted p-3 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">{doc.file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(docType as "FS" | "BRD")}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drop PDF file here or click to browse
                      </p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType as "FS" | "BRD", file);
                        }}
                        className="hidden"
                        id={`upload-${docType}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`upload-${docType}`)?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between mt-8">
        <div>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          
          {step === 1 ? (
            <Button 
              onClick={() => setStep(2)} 
              disabled={!canProceedToStep2}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Initiative"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}