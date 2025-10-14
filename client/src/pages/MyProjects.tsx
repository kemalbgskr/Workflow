import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";

export default function MyProjects() {
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
    {
      id: "4",
      code: "PRJ-2024-003",
      title: "Data Migration Project",
      type: "Project" as const,
      methodology: "Waterfall" as const,
      status: "Deployment Preparation",
      owner: { name: "Sarah Wilson", initials: "SW" },
      documentCount: 15,
    },
    {
      id: "5",
      code: "PRJ-2024-004",
      title: "API Gateway Implementation",
      type: "Project" as const,
      methodology: "Agile" as const,
      status: "Initiative Approved",
      owner: { name: "Tom Brown", initials: "TB" },
      documentCount: 6,
    },
    {
      id: "6",
      code: "NP-2024-020",
      title: "Quarterly System Review",
      type: "Non-Project" as const,
      methodology: "Agile" as const,
      status: "PTR",
      owner: { name: "Emily Chen", initials: "EC" },
      documentCount: 4,
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Projects</h1>
          <p className="text-muted-foreground">Manage and track all your projects</p>
        </div>
        <Button data-testid="button-new-project">
          <Plus className="h-4 w-4 mr-2" />
          New Initiative
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            data-testid="input-search-projects"
          />
        </div>
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
  );
}
