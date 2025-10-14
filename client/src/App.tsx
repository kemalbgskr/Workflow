import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import Dashboard from "@/pages/Dashboard";
import ProjectDetail from "@/pages/ProjectDetail";
import MyProjects from "@/pages/MyProjects";
import MyApprovals from "@/pages/MyApprovals";
import Documents from "@/pages/Documents";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/projects" component={MyProjects} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/approvals" component={MyApprovals} />
      <Route path="/documents" component={Documents} />
      <Route path="/users" component={Users} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  //todo: remove mock functionality - replace with real auth
  const isAuthenticated = true;
  const currentUser = { name: "John Doe", initials: "JD" };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Login />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <Header user={currentUser} />
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
