import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";

interface ApprovalCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    documentName: string;
    projectTitle: string;
  } | null;
  action: 'approve' | 'reject' | null;
  onConfirm: (comment: string) => void;
}

export default function ApprovalCommentDialog({
  open,
  onOpenChange,
  document,
  action,
  onConfirm,
}: ApprovalCommentDialogProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setComment("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(comment.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setComment("");
    onOpenChange(false);
  };

  if (!document || !action) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'approve' ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-red-600" />
            )}
            {action === 'approve' ? 'Approve Document' : 'Reject Document'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Document:</p>
            <p className="font-medium">{document.documentName}</p>
            <p className="text-sm text-muted-foreground">{document.projectTitle}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment">
              {action === 'approve' ? 'Approval Comment' : 'Rejection Reason'} *
            </Label>
            <Textarea
              id="comment"
              placeholder={action === 'approve' 
                ? "Add your approval comment..." 
                : "Please provide reason for rejection..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!comment.trim() || isSubmitting}
              variant={action === 'approve' ? 'default' : 'destructive'}
            >
              {isSubmitting ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}