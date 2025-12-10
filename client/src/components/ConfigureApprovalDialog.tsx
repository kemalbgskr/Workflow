import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StandardApprovalSetup from "@/components/StandardApprovalSetup";
import DocuSealApprovalSetup from "@/components/DocuSealApprovalSetup";
import { FileSignature, ExternalLink, Users } from "lucide-react";

interface ConfigureApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  documentId: string;
}

export default function ConfigureApprovalDialog({
  open,
  onOpenChange,
  onSuccess,
  documentId,
}: ConfigureApprovalDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<"standard" | "docuseal" | null>(null);

  const handleStandardApprovalSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleDocuSealSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleBack = () => {
    setSelectedMethod(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={(selectedMethod === "standard" || selectedMethod === "docuseal") ? "sm:max-w-4xl" : "sm:max-w-[500px]"}>
        <DialogHeader>
          <DialogTitle>
            {selectedMethod === "standard" ? "Standard Approval Setup" : 
             selectedMethod === "docuseal" ? "DocuSeal Digital Signature Setup" :
             "Configure Approval Workflow"}
          </DialogTitle>
          <DialogDescription>
            {selectedMethod === "standard" 
              ? "Configure approvers and their review sequence"
              : selectedMethod === "docuseal"
              ? "Setup digital signature workflow with DocuSeal"
              : "Choose how you want to handle document approvals"
            }
          </DialogDescription>
        </DialogHeader>
        
        {selectedMethod === "standard" ? (
          <StandardApprovalSetup 
            documentId={documentId}
            onSuccess={handleStandardApprovalSuccess}
            onCancel={handleBack}
          />
        ) : selectedMethod === "docuseal" ? (
          <DocuSealApprovalSetup 
            documentId={documentId}
            onSuccess={handleDocuSealSuccess}
            onCancel={handleBack}
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Choose Approval Method</h4>
              
              <div className="grid gap-3">
                <div 
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setSelectedMethod("standard")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">Standard Approval</p>
                        <p className="text-sm text-muted-foreground">Configure approvers with sequential or parallel workflow</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition-colors"
                  onClick={() => setSelectedMethod("docuseal")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                        <FileSignature className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">DocuSeal Digital Signature</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Setup digital signature workflow with template editing</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
