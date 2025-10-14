import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search } from "lucide-react";
import BNILogo from "./BNILogo";

interface HeaderProps {
  user?: {
    name: string;
    initials: string;
  };
  showSidebarTrigger?: boolean;
}

export default function Header({ user, showSidebarTrigger = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-6 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center gap-4">
        {showSidebarTrigger && <SidebarTrigger data-testid="button-sidebar-toggle" />}
        <BNILogo size="sm" />
      </div>

      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" data-testid="button-search">
          <Search className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
        </Button>
        {user && (
          <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-brand-teal text-white text-xs">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user.name}</span>
          </Button>
        )}
      </div>
    </header>
  );
}
