import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Upload } from "lucide-react";
import DocumentRow from "@/components/DocumentRow";
import ViewDocumentDialog from "@/components/ViewDocumentDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const getDocuments = async () => {
  const response = await fetch('/api/documents');
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  return response.json();
};

export default function Documents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingDocument, setViewingDocument] = useState<{
    id: string;
    filename: string;
    storageKey: string;
    type: string;
  } | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const { data: documents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
    refetchOnWindowFocus: true,
    staleTime: 30000
  });

  console.log('Documents from API:', documents);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);

  const deleteDocumentMutation = useMutation({
    mutationFn: (docId: string) => {
      console.log('Mutation function called with docId:', docId);
      return api.deleteDocument(docId);
    },
    onSuccess: (data) => {
      console.log('Delete success:', data);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: "Document Deleted", description: "Document has been deleted successfully." });
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
    }
  });
  
  const handleDocumentAction = (action: string, docId: string, filename: string) => {
    console.log('handleDocumentAction called:', action, docId, filename);
    switch (action) {
      case 'view':
        const doc = allDocuments.find((d: any) => d.id === docId);
        if (doc) {
          setViewingDocument({
            id: docId,
            filename: doc.filename,
            storageKey: doc.storageKey || `uploads/${docId}`,
            type: doc.documentType || 'application/pdf'
          });
          setShowViewDialog(true);
        }
        break;
      case 'configure':
        toast({ title: "Configure Document", description: `Configuring ${filename}...` });
        break;
      case 'send':
        toast({ title: "Send Document", description: `Sending ${filename} for approval...` });
        break;
      case 'download':
        const link = window.document.createElement('a');
        link.href = `/api/documents/${docId}/download`;
        link.download = filename;
        link.click();
        break;
      case 'delete':
        console.log('Delete action triggered for:', docId, filename);
        if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
          console.log('User confirmed delete, calling mutation for:', docId);
          deleteDocumentMutation.mutate(docId);
        } else {
          console.log('User cancelled delete');
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };
  
  const allDocuments: any[] = documents || [];
  console.log('All documents to display:', allDocuments);
  const draftDocs = allDocuments.filter(d => d.status === "DRAFT");
  const signingDocs = allDocuments.filter(d => d.status === "SIGNING" || d.status === "IN_REVIEW");
  const signedDocs = allDocuments.filter(d => d.status === "SIGNED");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Documents</h1>
          <p className="text-muted-foreground">Manage all project documents and approvals</p>
        </div>
        <Button 
          data-testid="button-upload-document"
          onClick={() => {
            toast({
              title: "Upload Document",
              description: "Document upload dialog will be implemented...",
            });
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            data-testid="input-search-documents"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Draft</p>
          <p className="text-2xl font-semibold mt-1">{draftDocs.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">In Signing</p>
          <p className="text-2xl font-semibold mt-1">{signingDocs.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Signed</p>
          <p className="text-2xl font-semibold mt-1">{signedDocs.length}</p>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-documents">All Documents</TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">Draft ({draftDocs.length})</TabsTrigger>
          <TabsTrigger value="signing" data-testid="tab-signing">In Signing ({signingDocs.length})</TabsTrigger>
          <TabsTrigger value="signed" data-testid="tab-signed">Signed ({signedDocs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">Failed to load documents</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          ) : allDocuments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No documents found</p>
            </div>
          ) : (
            allDocuments
              .filter((doc: any) => 
                searchTerm === "" || 
                doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((doc: any) => (
              <DocumentRow
                key={doc.id}
                {...doc}
                onView={() => handleDocumentAction('view', doc.id, doc.filename)}
                onConfigure={() => handleDocumentAction('configure', doc.id, doc.filename)}
                onSend={() => handleDocumentAction('send', doc.id, doc.filename)}
                onDownload={() => handleDocumentAction('download', doc.id, doc.filename)}
                onDelete={() => handleDocumentAction('delete', doc.id, doc.filename)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-3 mt-6">
          {draftDocs
            .filter((doc: any) => 
              searchTerm === "" || 
              doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((doc: any) => (
            <DocumentRow
              key={doc.id}
              {...doc}
              onView={() => handleDocumentAction('view', doc.id, doc.filename)}
              onConfigure={() => handleDocumentAction('configure', doc.id, doc.filename)}
              onSend={() => handleDocumentAction('send', doc.id, doc.filename)}
              onDownload={() => handleDocumentAction('download', doc.id, doc.filename)}
              onDelete={() => handleDocumentAction('delete', doc.id, doc.filename)}
            />
          ))}
        </TabsContent>

        <TabsContent value="signing" className="space-y-3 mt-6">
          {signingDocs
            .filter((doc: any) => 
              searchTerm === "" || 
              doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((doc: any) => (
            <DocumentRow
              key={doc.id}
              {...doc}
              onView={() => handleDocumentAction('view', doc.id, doc.filename)}
              onConfigure={() => handleDocumentAction('configure', doc.id, doc.filename)}
              onSend={() => handleDocumentAction('send', doc.id, doc.filename)}
              onDownload={() => handleDocumentAction('download', doc.id, doc.filename)}
              onDelete={() => handleDocumentAction('delete', doc.id, doc.filename)}
            />
          ))}
        </TabsContent>

        <TabsContent value="signed" className="space-y-3 mt-6">
          {signedDocs
            .filter((doc: any) => 
              searchTerm === "" || 
              doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((doc: any) => (
            <DocumentRow
              key={doc.id}
              {...doc}
              onView={() => handleDocumentAction('view', doc.id, doc.filename)}
              onConfigure={() => handleDocumentAction('configure', doc.id, doc.filename)}
              onSend={() => handleDocumentAction('send', doc.id, doc.filename)}
              onDownload={() => handleDocumentAction('download', doc.id, doc.filename)}
              onDelete={() => handleDocumentAction('delete', doc.id, doc.filename)}
            />
          ))}
        </TabsContent>


      </Tabs>
      
      <ViewDocumentDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        document={viewingDocument}
      />
    </div>
  );
}
