import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, MoreVertical } from "lucide-react";

export default function Users() {
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

  const roleColors: Record<string, string> = {
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
        <Button data-testid="button-add-user">
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
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {mockUsers.map((user) => (
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
                    className={roleColors[user.role] || ""}
                  >
                    {user.role}
                  </Badge>
                  <Badge 
                    variant={user.status === "Active" ? "default" : "secondary"}
                    className={user.status === "Active" 
                      ? "bg-success/20 text-success border-success/30" 
                      : ""}
                  >
                    {user.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{user.email}</span>
                  <span>•</span>
                  <span>{user.department}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  data-testid={`button-edit-user-${user.id}`}
                >
                  Edit
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  data-testid={`button-user-menu-${user.id}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
