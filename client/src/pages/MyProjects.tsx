import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import NewInitiativeDialog from "@/components/NewInitiativeDialog";
import EditProjectDialog from "@/components/EditProjectDialog";

export default function MyProjects() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projects, setProjects] = useState<any[]>([]);
  
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/with-owner');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setProjects(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      // Use mock data as fallback
    }
  };
  
  useEffect(() => {
    fetchProjects();
  }, []);
  


  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Projects</h1>
          <p className="text-muted-foreground">Manage and track all your projects</p>
        </div>
        <Button 
          data-testid="button-new-project"
          onClick={() => setShowNewDialog(true)}
        >
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(projects || [])
          .filter((project: any) => {
            if (!project || searchTerm === "") return true;
            const term = searchTerm.toLowerCase();
            return (project.title && project.title.toLowerCase().includes(term)) || 
                   (project.code && project.code.toLowerCase().includes(term));
          })
          .map((project: any) => (
            <ProjectCard
              key={project.id}
              {...project}
              onViewClick={() => setLocation(`/projects/${project.id}`)}
              onDelete={fetchProjects}
              onEdit={() => {
                setEditingProject(project);
                setShowEditDialog(true);
              }}
            />
          ))}
      </div>
      
      <NewInitiativeDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={fetchProjects}
      />
      
      <EditProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={fetchProjects}
        project={editingProject}
      />
    </div>
  );
}
