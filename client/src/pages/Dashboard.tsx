import { FileText, Users, Clock, CheckCircle } from "lucide-react";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
  //todo: remove mock functionality
  const mockProjects = [
    {
      id: "1",
      code: "PRJ-2024-001",
      title: "Core Banking System Upgrade",
      type: "Project" as const,
      methodology: "Waterfall" as const,
      status: "Kick Off",
      owner: { name: "John Doe", initials: "JD" },
      documentCount: 8,
    },
    {
      id: "2",
      code: "PRJ-2024-002",
      title: "Mobile App Enhancement",
      type: "Project" as const,
      methodology: "Agile" as const,
      status: "ARF",
      owner: { name: "Jane Smith", initials: "JS" },
      documentCount: 12,
    },
    {
      id: "3",
      code: "NP-2024-015",
      title: "Security Audit Q1",
      type: "Non-Project" as const,
      methodology: "Agile" as const,
      status: "Go Live",
      owner: { name: "Mike Johnson", initials: "MJ" },
      documentCount: 5,
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, manage your SDLC approvals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Requests"
          value="12"
          icon={FileText}
          accentColor="teal"
          trend={{ value: "3 this week", isPositive: true }}
        />
        <StatCard
          title="Pending Approvals"
          value="8"
          icon={Clock}
          accentColor="warning"
          trend={{ value: "2 urgent", isPositive: false }}
        />
        <StatCard
          title="Active Projects"
          value="24"
          icon={Users}
          accentColor="orange"
        />
        <StatCard
          title="Completed"
          value="156"
          icon={CheckCircle}
          accentColor="success"
          trend={{ value: "12 this month", isPositive: true }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Button data-testid="button-new-initiative">
            <Plus className="h-4 w-4 mr-2" />
            New Initiative
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
              onViewClick={() => console.log(`View project ${project.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
