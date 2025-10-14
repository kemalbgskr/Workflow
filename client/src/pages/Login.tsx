import LoginForm from "@/components/LoginForm";

export default function Login() {
  const handleSubmit = (email: string, password: string, remember: boolean) => {
    console.log("Login attempt:", { email, password, remember });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-brand-dark to-background">
      <LoginForm onSubmit={handleSubmit} />
    </div>
  );
}
