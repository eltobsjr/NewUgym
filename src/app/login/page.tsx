
import { LoginForm } from '@/components/auth/login-form';
import { AuthBackground } from '@/components/auth/auth-background';

export default function LoginPage() {
  return (
    <div
      className="w-full min-h-screen flex items-center justify-center p-4 relative"
    >
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
