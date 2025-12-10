import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import UserDialog from "@/components/UserDialog";

export default function Users() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleAddUser = () => {
    setDialogMode("create");
    setEditingUser(null);
    setShowUserDialog(true);
  };
  
  const handleEditUser = (user: any) => {
    setDialogMode("edit");
    setEditingUser(user);
    setShowUserDialog(true);
  };
  
  const handleUserMenuAction = (action: string, userId: string, userName: string) => {
    switch (action) {
      case 'permissions':
        toast({
          title: "Manage Permissions",
          description: `Managing permissions for ${userName}...`,
        });
        break;
      case 'deactivate':
        handleDeleteUser(userId, userName);
        break;
      case 'reset-password':
        toast({
          title: "Reset Password",
          description: `Password reset email sent to ${userName}.`,
        });
        break;
    }
  };
  
  //todo: remove mock functionality
  const mockUsers = [
    {
      id: "1",
      name: "John Doe",
      initials: "JD",
      email: "john.doe@bni.co.id",
      role: "Requester",
      department: "Business Unit",
      status: "Active",
    },
    {
      id: "2",
      name: "Jane Smith",
      initials: "JS",
      email: "jane.smith@bni.co.id",
      role: "Approver",
      department: "PMO",
      status: "Active",
    },
    {
      id: "3",
      name: "Mike Johnson",
      initials: "MJ",
      email: "mike.johnson@bni.co.id",
      role: "Approver",
      department: "ISA",
      status: "Active",
    },
    {
      id: "4",
      name: "Sarah Wilson",
      initials: "SW",
      email: "sarah.wilson@bni.co.id",
      role: "Approver",
      department: "DEV",
      status: "Active",
    },
    {
      id: "5",
      name: "Tom Brown",
      initials: "TB",
      email: "tom.brown@bni.co.id",
      role: "Admin",
      department: "IT",
      status: "Active",
    },
    {
      id: "6",
      name: "Emily Chen",
      initials: "EC",
      email: "emily.chen@bni.co.id",
      role: "Approver",
      department: "CISO",
      status: "Inactive",
    },
  ];

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchUsers();
        toast({
          title: "User Deleted",
          description: `${userName} has been deleted successfully.`,
        });
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-brand-orange/20 text-brand-orange border-brand-orange/30",
    APPROVER: "bg-primary/20 text-primary border-primary/30",
    REQUESTER: "bg-info/20 text-info border-info/30",
    Admin: "bg-brand-orange/20 text-brand-orange border-brand-orange/30",
    Approver: "bg-primary/20 text-primary border-primary/30",
    Requester: "bg-info/20 text-info border-info/30",
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">Manage users and permissions</p>
        </div>
        <Button 
          data-testid="button-add-user"
          onClick={handleAddUser}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            data-testid="input-search-users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {(users.length > 0 ? users : mockUsers)
          .filter(user => 
            searchTerm === "" || 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map((user) => (
          <Card key={user.id} className="p-6 hover-elevate" data-testid={`card-user-${user.id}`}>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-brand-teal text-white">
                  {user.initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{user.name}</h3>
                  <Badge 
                    variant="outline" 
                    className={roleColors[user.role] || roleColors[user.role?.toUpperCase()] || ""}
                  >
                    {user.role === 'REQUESTER' ? 'Requester' : 
                     user.role === 'APPROVER' ? 'Approver' : 
                     user.role === 'ADMIN' ? 'Admin' : user.role}
                  </Badge>
                  <Badge 
                    variant="default"
                    className="bg-success/20 text-success border-success/30"
                  >
                    Active
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{user.email}</span>
                  <span>•</span>
                  <span>{user.department || 'No Department'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  data-testid={`button-edit-user-${user.id}`}
                  onClick={() => handleEditUser(user)}
                >
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      data-testid={`button-user-menu-${user.id}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleUserMenuAction('permissions', user.id, user.name)}>
                      Manage Permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUserMenuAction('reset-password', user.id, user.name)}>
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleUserMenuAction('deactivate', user.id, user.name)}
                      className="text-destructive"
                    >
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <UserDialog
        open={showUserDialog}
        onOpenChange={setShowUserDialog}
        onSuccess={fetchUsers}
        user={editingUser}
        mode={dialogMode}
      />
    </div>
  );
}
