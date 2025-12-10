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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  user?: any;
  mode: "create" | "edit";
}

export default function UserDialog({
  open,
  onOpenChange,
  onSuccess,
  user,
  mode,
}: UserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    department: "",
  });

  useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "",
        department: user.department || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        department: "",
      });
    }
  }, [user, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "create" && !formData.password) {
      toast({
        title: "Validation Error",
        description: "Password is required for new users.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    console.log(`${mode === "create" ? "Creating" : "Updating"} user with data:`, formData);

    try {
      const url = mode === "create" ? "/api/users" : `/api/users/${user.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const submitData = mode === "edit" && !formData.password 
        ? { ...formData, password: undefined } 
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to ${mode} user`);
      }

      const resultUser = await response.json();
      console.log(`${mode === "create" ? "Created" : "Updated"} user:`, resultUser);
      
      toast({
        title: mode === "create" ? "User Created" : "User Updated",
        description: `${resultUser.name} has been ${mode === "create" ? "created" : "updated"} successfully.`,
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(`${mode} user error:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode} user. Please try again.`,
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
          <DialogTitle>{mode === "create" ? "Add New User" : "Edit User"}</DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new user account with appropriate permissions." 
              : "Update user information and settings."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {mode === "create" ? "*" : "(leave blank to keep current)"}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={mode === "create" ? "Enter password" : "Enter new password"}
              required={mode === "create"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REQUESTER">Requester</SelectItem>
                  <SelectItem value="APPROVER">Approver</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Enter department"
              />
            </div>
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
              {loading 
                ? (mode === "create" ? "Creating..." : "Updating...") 
                : (mode === "create" ? "Create User" : "Update User")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}