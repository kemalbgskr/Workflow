import LoginForm from '../LoginForm';

export default function LoginFormExample() {
  const handleSubmit = (email: string, password: string, remember: boolean) => {
    console.log('Login attempt:', { email, password, remember });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-brand-dark to-background">
      <LoginForm onSubmit={handleSubmit} />
    </div>
  );
}
