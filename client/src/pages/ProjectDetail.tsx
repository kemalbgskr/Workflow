import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import TimelineStepper from "@/components/TimelineStepper";
import DocumentRow from "@/components/DocumentRow";
import ApproverCard from "@/components/ApproverCard";
import CommentThread from "@/components/CommentThread";

export default function ProjectDetail() {
  //todo: remove mock functionality
  const sdlcSteps = [
    { label: "Initiative", status: "completed" as const },
    { label: "Demand", status: "completed" as const },
    { label: "Approved", status: "completed" as const },
    { label: "Kick Off", status: "current" as const },
    { label: "ARF", status: "pending" as const },
    { label: "Deployment", status: "pending" as const },
    { label: "PTR", status: "pending" as const },
    { label: "Go Live", status: "pending" as const },
  ];

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
    }
  ];

  const mockApprovers = [
    {
      name: "John Doe",
      initials: "JD",
      email: "john.doe@bni.co.id",
      role: "PMO",
      orderIndex: 0,
      status: "SIGNED" as const,
      signedAt: "2 days ago",
      sequential: true
    },
    {
      name: "Jane Smith",
      initials: "JS",
      email: "jane.smith@bni.co.id",
      role: "ISA",
      orderIndex: 1,
      status: "SIGNED" as const,
      signedAt: "1 day ago",
      sequential: true
    },
    {
      name: "Mike Johnson",
      initials: "MJ",
      email: "mike.johnson@bni.co.id",
      role: "DEV Lead",
      orderIndex: 2,
      status: "PENDING" as const,
      sequential: true
    }
  ];

  const mockComments = [
    {
      id: "1",
      author: { name: "John Doe", initials: "JD" },
      body: "Please update section 3.2 to include the new security requirements.",
      createdAt: "2 hours ago"
    },
    {
      id: "2",
      author: { name: "Jane Smith", initials: "JS" },
      body: "I've reviewed the changes and they look good. Approving once the security updates are in.",
      createdAt: "1 hour ago"
    }
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Core Banking System Upgrade</h1>
            <StatusBadge status="Kick Off" />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-brand-teal text-white text-xs">JD</AvatarFallback>
              </Avatar>
              <span>John Doe</span>
            </div>
            <span>•</span>
            <span>PRJ-2024-001</span>
            <span>•</span>
            <span>Waterfall</span>
          </div>
        </div>
        <Button size="icon" variant="ghost" data-testid="button-project-menu">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      <Card className="p-6">
        <TimelineStepper steps={sdlcSteps} />
      </Card>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="approvals" data-testid="tab-approvals">Approvals</TabsTrigger>
          <TabsTrigger value="comments" data-testid="tab-comments">Comments</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-3 mt-6">
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

        <TabsContent value="approvals" className="space-y-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Approval Workflow</h3>
            <Button size="sm" data-testid="button-configure-approvals">Configure</Button>
          </div>
          <div className="space-y-2">
            {mockApprovers.map((approver) => (
              <ApproverCard key={approver.email} {...approver} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <CommentThread 
            comments={mockComments}
            onAddComment={(body) => console.log('Add comment:', body)}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="p-6">
            <p className="text-muted-foreground text-center">Audit history will be displayed here</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
