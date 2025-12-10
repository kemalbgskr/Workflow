import LoginForm from "@/components/LoginForm";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { toast } = useToast();

  const handleSubmit = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting...",
        });
        // On successful login, reload the page.
        // App.tsx will then fetch the user and render the authenticated view.
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast({
          title: "Login Failed",
          description: errorData.message || "Invalid credentials, please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "An Error Occurred",
        description: "Could not connect to the server. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-brand-dark to-background">
      <LoginForm onSubmit={handleSubmit} />
    </div>
  );
}
