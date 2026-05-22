import { AuthBackground } from '@/components/auth/auth-background';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 relative">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
