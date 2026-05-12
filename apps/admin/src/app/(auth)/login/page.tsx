import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-green-950">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-white mb-8">SCF Admin</h1>
        <LoginForm />
      </div>
    </div>
  );
}
