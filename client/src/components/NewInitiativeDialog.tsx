import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NewInitiativeWizard from "./NewInitiativeWizard";
import { useLocation } from "wouter";

interface NewInitiativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function NewInitiativeDialog({ open, onOpenChange, onSuccess }: NewInitiativeDialogProps) {
  const [, setLocation] = useLocation();

  const handleComplete = (projectId: string) => {
    onOpenChange(false);
    onSuccess?.();
    setLocation(`/projects/${projectId}`);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New SDLC Initiative</DialogTitle>
        </DialogHeader>
        <NewInitiativeWizard 
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}