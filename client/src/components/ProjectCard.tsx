import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, Folder } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface ProjectCardProps {
  id: string;
  code: string;
  title: string;
  type: "Project" | "Non-Project";
  methodology: "Waterfall" | "Agile";
  status: string;
  owner: {
    name: string;
    initials: string;
  };
  documentCount: number;
  onViewClick?: () => void;
}

export default function ProjectCard({ 
  id, 
  code, 
  title, 
  type, 
  methodology, 
  status, 
  owner, 
  documentCount,
  onViewClick
}: ProjectCardProps) {
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
          <Button size="icon" variant="ghost" data-testid={`button-project-menu-${id}`}>
            <MoreVertical className="h-4 w-4" />
          </Button>
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
          <StatusBadge status={status as any} />
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
