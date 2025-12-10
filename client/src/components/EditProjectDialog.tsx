import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  project: any;
}

export default function EditProjectDialog({
  open,
  onOpenChange,
  onSuccess,
  project,
}: EditProjectDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    category: "",
    methodology: "",
    status: "",
  });

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        type: project.type || "",
        category: project.category || "",
        methodology: project.methodology || "",
        status: project.status || "",
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.methodology) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    console.log('Updating project with data:', formData);

    try {
      console.log('Updating project with data:', formData);
      const updatedProject: any = await api.updateProject(project.id, formData);
      console.log('Updated project:', updatedProject);
      
      toast({
        title: "Project Updated",
        description: `${updatedProject.title} has been updated successfully.`,
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Update project error:', error);
      toast({
        title: "Error",
        description: (error as any).message || "Failed to update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project information and settings.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter project title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project">Project</SelectItem>
                  <SelectItem value="Non-Project">Non-Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="methodology">Methodology *</Label>
              <Select
                value={formData.methodology}
                onValueChange={(value) => setFormData({ ...formData, methodology: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select methodology" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Waterfall">Waterfall</SelectItem>
                  <SelectItem value="Agile">Agile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                <SelectItem value="Application">Application</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Data">Data</SelectItem>
                <SelectItem value="Process">Process</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Initiative Submitted">Initiative Submitted</SelectItem>
                <SelectItem value="Demand Prioritized">Demand Prioritized</SelectItem>
                <SelectItem value="Initiative Approved">Initiative Approved</SelectItem>
                <SelectItem value="Kick Off">Kick Off</SelectItem>
                <SelectItem value="ARF">ARF</SelectItem>
                <SelectItem value="Deployment Preparation">Deployment Preparation</SelectItem>
                <SelectItem value="RCB">RCB</SelectItem>
                <SelectItem value="Deployment">Deployment</SelectItem>
                <SelectItem value="PTR">PTR</SelectItem>
                <SelectItem value="Go Live">Go Live</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}