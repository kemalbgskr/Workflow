import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
}

export default function FilePreviewDialog({ 
  open, 
  onOpenChange, 
  fileName, 
  fileUrl,
  downloadUrl 
}: FilePreviewDialogProps) {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
  const isPdf = fileExtension === 'pdf';
  const isText = ['txt', 'md'].includes(fileExtension || '');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl || fileUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{fileName}</DialogTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isImage && (
            <div className="flex justify-center p-4">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
          
          {isPdf && (
            <div className="w-full h-[70vh]">
              <iframe
                src={fileUrl}
                className="w-full h-full border rounded-lg"
                title={fileName}
              />
            </div>
          )}
          
          {isText && (
            <div className="p-4">
              <iframe
                src={fileUrl}
                className="w-full h-[60vh] border rounded-lg bg-white"
                title={fileName}
              />
            </div>
          )}
          
          {!isImage && !isPdf && !isText && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">Preview not available</h3>
              <p className="text-muted-foreground mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download to view
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}