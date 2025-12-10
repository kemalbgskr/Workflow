import { Switch, Route, Redirect } from "wouter";
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
import DocuSealSetup from "@/pages/DocuSealSetup";
import SignatureStatus from "@/pages/SignatureStatus";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

import { type User } from "@shared/schema";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        // If the server returns 401 or any other error, user is not authenticated
        return null;
      })
      .then(data => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // If user is not authenticated, only render the public routes
  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Switch>
            <Route path="/login" component={Login} />
            {/* For any other route, redirect to login */}
            <Route>
              <Redirect to="/login" />
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // If user is authenticated, render the full app layout
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <Header user={user} />
              <main className="flex-1 overflow-auto">
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/projects" component={MyProjects} />
                  <Route path="/projects/:id" component={ProjectDetail} />
                  <Route path="/approvals">
                    {user?.role === 'ADMIN' || user?.role === 'APPROVER' ? <MyApprovals /> : <Redirect to="/" />}
                  </Route>
                  <Route path="/documents" component={Documents} />
                  <Route path="/documents/:documentId/docuseal-setup" component={DocuSealSetup} />
                  <Route path="/documents/:documentId/signature-status" component={SignatureStatus} />
                  <Route path="/users">
                    {user?.role === 'ADMIN' ? <Users /> : <Redirect to="/" />}
                  </Route>
                  <Route path="/settings" component={Settings} />
                  {/* If logged in and at /login, redirect to dashboard */}
                  <Route path="/login">
                    <Redirect to="/" />
                  </Route>
                  <Route component={NotFound} />
                </Switch>
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