import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import BNILogo from "./BNILogo";

interface LoginFormProps {
  onSubmit?: (email: string, password: string, remember: boolean) => void;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login submitted:", { email, password, remember });
    onSubmit?.(email, password, remember);
  };

  return (
    <div className="w-full max-w-md" data-testid="form-login">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <BNILogo size="lg" />
        </div>
        <h1 className="text-2xl font-semibold">Welcome Back</h1>
        <p className="text-muted-foreground mt-2">Sign in to access your SDLC dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="input-email"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="input-password"
            className="mt-1.5"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked as boolean)}
              data-testid="checkbox-remember"
            />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Remember me
            </Label>
          </div>
          <Button variant="ghost" className="px-0 h-auto" data-testid="button-forgot-password">
            Forgot password?
          </Button>
        </div>

        <Button type="submit" className="w-full" data-testid="button-login">
          Sign In
        </Button>
      </form>
    </div>
  );
}