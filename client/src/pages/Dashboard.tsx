import { FileText, Users, Clock, CheckCircle } from "lucide-react";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useLocation } from "wouter";
import NewInitiativeDialog from "@/components/NewInitiativeDialog";
import EditProjectDialog from "@/components/EditProjectDialog";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// API fetching functions
const getProjectsWithOwner = async () => {
  const response = await fetch('/api/projects/with-owner');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
};

const getDashboardStats = async () => {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  return response.json();
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjectsWithOwner,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['stats'],
    queryFn: getDashboardStats,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };
  


  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, manage your SDLC approvals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Requests"
          value={(stats?.myRequests || 0).toString()}
          icon={FileText}
          accentColor="teal"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Pending Approvals"
          value={(stats?.pendingApprovals || 0).toString()}
          icon={Clock}
          accentColor="warning"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Active Projects"
          value={(stats?.activeProjects || 0).toString()}
          icon={Users}
          accentColor="orange"
          isLoading={isLoadingStats}
        />
        <StatCard
          title="Completed"
          value={(stats?.completed || 0).toString()}
          icon={CheckCircle}
          accentColor="success"
          isLoading={isLoadingStats}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              data-testid="button-new-initiative"
              onClick={() => setShowNewDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Initiative
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(projects || [])
            .filter((project: any) => project.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((project: any) => (
            <ProjectCard
              key={project.id}
              {...project}
              onViewClick={() => setLocation(`/projects/${project.id}`)}
              onEdit={() => {
                setEditingProject(project);
                setShowEditDialog(true);
              }}
            />
          ))}
        </div>
      </div>
      
      <NewInitiativeDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={handleSuccess}
      />
      
      <EditProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleSuccess}
        project={editingProject}
      />
    </div>
  );
}