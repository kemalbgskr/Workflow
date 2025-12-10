import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, Folder, Archive, Trash2, Copy, ChevronDown, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProjectCardProps {
  id: string;
  code: string;
  title: string;
  type: string;
  methodology: string;
  status: string;
  priority?: string;
  owner: {
    name: string;
    initials: string;
  };
  documentCount: number;
  onViewClick?: () => void;
  onEdit?: () => void;
}

export default function ProjectCard({
  id,
  code,
  title,
  type,
  methodology,
  status,
  priority,
  owner,
  documentCount,
  onViewClick,
  onEdit
}: ProjectCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusOptions = [
    "Initiative Submitted", 
    "Demand Prioritized",
    "Initiative Approved",
    "Kick Off",
    "ARF",
    "Deployment Preparation", 
    "RCB",
    "Deployment",
    "PTR",
    "Go Live"
  ];

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => api.updateProjectStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({ title: "Status Updated", description: `Project status updated successfully.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: () => api.archiveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: "Project Archived", description: `${title} has been archived.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to archive project.", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: "Project Deleted", description: `${title} has been deleted.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: () => api.duplicateProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: "Project Duplicated", description: `${title} has been duplicated.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to duplicate project.", variant: "destructive" });
    }
  });
  return (
    <Card className="hover-elevate" data-testid={`card-project-${id}`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-muted-foreground">{code}</p>
                <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                  {type}
                </span>
              </div>
              <h3 className="font-semibold truncate" data-testid={`text-project-title-${id}`}>{title}</h3>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" data-testid={`button-project-menu-${id}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => duplicateMutation.mutate()}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => archiveMutation.mutate()}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteMutation.mutate()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-brand-teal text-white text-xs">
                {owner.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{owner.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{methodology}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                  <StatusBadge status={status as any} />
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.map((statusOption) => (
                  <DropdownMenuItem 
                    key={statusOption}
                    onClick={() => updateStatusMutation.mutate(statusOption)}
                    className={status === statusOption ? "bg-primary/10 text-primary font-medium" : ""}
                  >
                    {status === statusOption && "✓ "}{statusOption}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {priority && <PriorityBadge priority={priority} />}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{documentCount} docs</span>
            <Button
              size="sm"
              variant="outline"
              onClick={onViewClick}
              data-testid={`button-view-project-${id}`}
            >
              View
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}