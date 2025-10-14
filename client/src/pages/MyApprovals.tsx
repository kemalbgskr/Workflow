import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Eye, Check, X } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function MyApprovals() {
  //todo: remove mock functionality
  const mockApprovals = [
    {
      id: "1",
      documentName: "Business_Requirements_v2.pdf",
      documentType: "BRD",
      projectCode: "PRJ-2024-001",
      projectTitle: "Core Banking System Upgrade",
      requester: { name: "John Doe", initials: "JD" },
      dueDate: "Today",
      status: "PENDING" as const,
      priority: "High",
    },
    {
      id: "2",
      documentName: "Project_Charter_v1.pdf",
      documentType: "PROJECT_CHARTER",
      projectCode: "PRJ-2024-002",
      projectTitle: "Mobile App Enhancement",
      requester: { name: "Jane Smith", initials: "JS" },
      dueDate: "Tomorrow",
      status: "PENDING" as const,
      priority: "Medium",
    },
    {
      id: "3",
      documentName: "ARF_Form_v3.pdf",
      documentType: "ARF",
      projectCode: "PRJ-2024-003",
      projectTitle: "Data Migration Project",
      requester: { name: "Sarah Wilson", initials: "SW" },
      dueDate: "In 3 days",
      status: "PENDING" as const,
      priority: "Low",
    },
    {
      id: "4",
      documentName: "Feasibility_Study_v2.pdf",
      documentType: "FS",
      projectCode: "PRJ-2024-001",
      projectTitle: "Core Banking System Upgrade",
      requester: { name: "John Doe", initials: "JD" },
      dueDate: "2 days ago",
      status: "SIGNED" as const,
      priority: "High",
    },
  ];

  const pendingApprovals = mockApprovals.filter(a => a.status === "PENDING");
  const completedApprovals = mockApprovals.filter(a => a.status === "SIGNED");

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Approvals</h1>
        <p className="text-muted-foreground">Review and approve pending documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold mt-1">{pendingApprovals.length}</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <FileText className="h-6 w-6 text-warning" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Urgent</p>
              <p className="text-2xl font-semibold mt-1">
                {pendingApprovals.filter(a => a.priority === "High").length}
              </p>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold mt-1">{completedApprovals.length}</p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <Check className="h-6 w-6 text-success" />
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
        <div className="space-y-3">
          {pendingApprovals.map((approval) => (
            <Card key={approval.id} className="p-6 hover-elevate" data-testid={`card-approval-${approval.id}`}>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{approval.documentName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {approval.projectCode} - {approval.projectTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={approval.priority === "High" ? "destructive" : "outline"}>
                        {approval.priority}
                      </Badge>
                      <StatusBadge status={approval.status} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-brand-teal text-white text-xs">
                          {approval.requester.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{approval.requester.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Due: {approval.dueDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    data-testid={`button-view-approval-${approval.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default"
                    data-testid={`button-approve-${approval.id}`}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    data-testid={`button-decline-${approval.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recently Completed</h2>
        <div className="space-y-3">
          {completedApprovals.map((approval) => (
            <Card key={approval.id} className="p-6 opacity-70" data-testid={`card-completed-${approval.id}`}>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Check className="h-5 w-5 text-success" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{approval.documentName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {approval.projectCode} - {approval.projectTitle}
                  </p>
                </div>

                <StatusBadge status={approval.status} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
