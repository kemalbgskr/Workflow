import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ViewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    filename: string;
    storageKey: string;
    type: string;
  } | null;
}

export default function ViewDocumentDialog({
  open,
  onOpenChange,
  document,
}: ViewDocumentDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Reset states when document changes or dialog opens
  useEffect(() => {
    if (open && document) {
      setIsLoading(true);
      setHasError(false);
      loadDocument();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [open, document?.id]);

  const loadDocument = async () => {
    if (!document) return;
    
    try {
      const response = await fetch(`/api/documents/${document.id}/view`);
      if (!response.ok) throw new Error('Failed to load document');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setIsLoading(false);
    } catch (error) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  if (!document) return null;

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = `/api/documents/${document.id}/download`;
    link.download = document.filename;
    link.click();
  };



  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[calc(100vh-80px)] p-0 gap-0" hideCloseButton>
        <DialogHeader className="px-6 py-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="truncate">{document.filename}</DialogTitle>
              <DialogDescription className="sr-only">
                Document viewer for {document.filename}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 px-6 pb-4">
          {document.type.includes('pdf') || document.filename.toLowerCase().endsWith('.pdf') ? (
            <div className="w-full h-[calc(100vh-120px)] border rounded bg-white relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">Loading document...</p>
                  </div>
                </div>
              )}
              {hasError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Unable to preview document</h3>
                    <p className="text-muted-foreground mb-4">The document could not be loaded for preview</p>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download instead
                    </Button>
                  </div>
                </div>
              ) : (
                pdfUrl && (
                  <iframe 
                    src={pdfUrl} 
                    className="w-full h-[calc(100%-20px)]" 
                    title={document.filename}
                  />
                )
              )}
            </div>
          ) : document.type.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(document.filename) ? (
            <div className="flex items-center justify-center h-full bg-muted rounded">
              <img 
                src={pdfUrl || ''} 
                alt={document.filename}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : document.type.includes('text') || /\.(txt|md|json|xml|csv)$/i.test(document.filename) ? (
            <div className="w-full h-full border rounded bg-white p-4 relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">Loading document...</p>
                  </div>
                </div>
              )}
              <iframe 
                src={pdfUrl || ''} 
                className="w-full h-full border-0" 
                title={document.filename}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-muted rounded">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Download className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{document.filename}</h3>
                  <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                </div>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download to view
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
