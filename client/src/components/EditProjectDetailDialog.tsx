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
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface EditProjectDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  project: any;
}

export default function EditProjectDetailDialog({
  open,
  onOpenChange,
  onSuccess,
  project,
}: EditProjectDetailDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    category: "",
    methodology: "",
    teamMembers: [] as string[],
  });

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        type: project.type || "",
        category: project.category || "",
        methodology: project.methodology || "",
        teamMembers: project.teamMembers || [],
      });
    }
  }, [project]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

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
    console.log('Submitting form data:', formData);

    try {
      // Temporarily remove teamMembers from the data being sent
      const { teamMembers, ...dataToSend } = formData;
      console.log('Data being sent to API:', dataToSend);
      
      const updatedProject: any = await api.updateProject(project.id, dataToSend);
      console.log('Updated project response:', updatedProject);
      
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
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = (userId: string) => {
    if (!formData.teamMembers.includes(userId)) {
      setFormData({
        ...formData,
        teamMembers: [...formData.teamMembers, userId]
      });
    }
  };

  const removeTeamMember = (userId: string) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers.filter(id => id !== userId)
    });
  };

  const getSelectedUsers = () => {
    return users.filter(user => formData.teamMembers.includes(user.id));
  };

  const getAvailableUsers = () => {
    return users.filter(user => !formData.teamMembers.includes(user.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
          <DialogDescription>
            Update project information and manage team members.
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
              rows={3}
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

          {/* Temporarily disabled team members section */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Team Members (Coming Soon)</Label>
            <p className="text-sm text-muted-foreground">Team member management will be available after database migration.</p>
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