import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  projectId: string;
  lifecycleStep?: string;
}

export default function UploadDocumentDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  lifecycleStep,
}: UploadDocumentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedLifecycle, setSelectedLifecycle] = useState(lifecycleStep || "");
  const [documentType, setDocumentType] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const lifecycleOptions = [
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

  const documentTypes = [
    { value: "FS", label: "Feasibility Study" },
    { value: "BRD", label: "Business Requirements Document" },
    { value: "PROJECT_CHARTER", label: "Project Charter" },
    { value: "ARF", label: "ARF Form" },
    { value: "FSD", label: "Functional Specification Document" },
    { value: "TECHNICAL_SPEC", label: "Technical Specification" },
    { value: "TEST_PLAN", label: "Test Plan" },
    { value: "DEPLOYMENT_GUIDE", label: "Deployment Guide" },
    { value: "USER_MANUAL", label: "User Manual" },
    { value: "OTHER", label: "Other Document" }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !selectedLifecycle || !documentType || !priority) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);
    formData.append("lifecycleStep", selectedLifecycle);
    formData.append("documentType", documentType);
    formData.append("priority", priority);

    console.log("Uploading document with data:", { 
      file, 
      projectId, 
      lifecycleStep: selectedLifecycle,
      documentType
    });

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Document Uploaded",
          description: "The document has been uploaded successfully.",
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error("Failed to upload document");
      }
    } catch (error) {
      console.error("Upload document error:", error);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document for this lifecycle step.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lifecycle">Lifecycle Step *</Label>
            <Select value={selectedLifecycle} onValueChange={setSelectedLifecycle}>
              <SelectTrigger>
                <SelectValue placeholder="Select lifecycle step" />
              </SelectTrigger>
              <SelectContent>
                {lifecycleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="docType">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">🟢 Low Priority</SelectItem>
                <SelectItem value="MEDIUM">🟡 Medium Priority</SelectItem>
                <SelectItem value="HIGH">🟠 High Priority</SelectItem>
                <SelectItem value="CRITICAL">🔴 Critical Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file">Document File *</Label>
            <Input id="file" type="file" onChange={handleFileChange} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
