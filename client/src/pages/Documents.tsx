import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Upload } from "lucide-react";
import DocumentRow from "@/components/DocumentRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Documents() {
  //todo: remove mock functionality
  const mockDocuments = [
    {
      id: "1",
      filename: "Feasibility_Study_v3.pdf",
      type: "FS" as const,
      version: 3,
      status: "SIGNED" as const,
      uploadedBy: "John Doe",
      uploadedAt: "2 days ago"
    },
    {
      id: "2",
      filename: "Business_Requirements_v2.pdf",
      type: "BRD" as const,
      version: 2,
      status: "SIGNING" as const,
      uploadedBy: "Jane Smith",
      uploadedAt: "1 day ago"
    },
    {
      id: "3",
      filename: "Project_Charter_Draft.pdf",
      type: "PROJECT_CHARTER" as const,
      version: 1,
      status: "DRAFT" as const,
      uploadedBy: "Mike Johnson",
      uploadedAt: "3 hours ago"
    },
    {
      id: "4",
      filename: "ARF_Form_v2.pdf",
      type: "ARF" as const,
      version: 2,
      status: "IN_REVIEW" as const,
      uploadedBy: "Sarah Wilson",
      uploadedAt: "5 hours ago"
    },
    {
      id: "5",
      filename: "Functional_Spec_v1.pdf",
      type: "FSD" as const,
      version: 1,
      status: "DRAFT" as const,
      uploadedBy: "Tom Brown",
      uploadedAt: "1 week ago"
    },
  ];

  const draftDocs = mockDocuments.filter(d => d.status === "DRAFT");
  const signingDocs = mockDocuments.filter(d => d.status === "SIGNING" || d.status === "IN_REVIEW");
  const signedDocs = mockDocuments.filter(d => d.status === "SIGNED");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Documents</h1>
          <p className="text-muted-foreground">Manage all project documents and approvals</p>
        </div>
        <Button data-testid="button-upload-document">
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
          {mockDocuments.map((doc) => (
            <DocumentRow
              key={doc.id}
              {...doc}
              onView={() => console.log(`View document ${doc.id}`)}
              onConfigure={() => console.log(`Configure ${doc.id}`)}
              onSend={() => console.log(`Send ${doc.id}`)}
              onDownload={() => console.log(`Download ${doc.id}`)}
            />
          ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-3 mt-6">
          {draftDocs.map((doc) => (
            <DocumentRow
              key={doc.id}
              {...doc}
              onView={() => console.log(`View document ${doc.id}`)}
              onConfigure={() => console.log(`Configure ${doc.id}`)}
              onSend={() => console.log(`Send ${doc.id}`)}
              onDownload={() => console.log(`Download ${doc.id}`)}
            />
          ))}
        </TabsContent>

        <TabsContent value="signing" className="space-y-3 mt-6">
          {signingDocs.map((doc) => (
            <DocumentRow
              key={doc.id}
              {...doc}
              onView={() => console.log(`View document ${doc.id}`)}
              onConfigure={() => console.log(`Configure ${doc.id}`)}
              onSend={() => console.log(`Send ${doc.id}`)}
              onDownload={() => console.log(`Download ${doc.id}`)}
            />
          ))}
        </TabsContent>

        <TabsContent value="signed" className="space-y-3 mt-6">
          {signedDocs.map((doc) => (
            <DocumentRow
              key={doc.id}
              {...doc}
              onView={() => console.log(`View document ${doc.id}`)}
              onConfigure={() => console.log(`Configure ${doc.id}`)}
              onSend={() => console.log(`Send ${doc.id}`)}
              onDownload={() => console.log(`Download ${doc.id}`)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
