"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dumbbell, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Phase = "exchanging" | "form" | "success" | "error";

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <UpdatePasswordForm />
    </Suspense>
  );
}

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("exchanging");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Exchange the PKCE code for a session when the page loads
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Link inválido ou expirado. Solicite um novo link de recuperação.");
      setPhase("error");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setError("Link inválido ou expirado. Solicite um novo link de recuperação.");
          setPhase("error");
        } else {
          setPhase("form");
        }
      });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Não foi possível atualizar a senha.");
        return;
      }

      setPhase("success");
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Dumbbell className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Ugym</h1>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Nova Senha</h2>
            <p className="text-muted-foreground mt-1">
              Crie uma senha forte para sua conta.
            </p>
          </div>

          {phase === "exchanging" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Validando link...</p>
            </div>
          )}

          {phase === "error" && (
            <div className="w-full space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/reset-password")}
              >
                Solicitar novo link
              </Button>
            </div>
          )}

          {phase === "success" && (
            <div className="w-full space-y-4">
              <Alert>
                <AlertDescription>
                  Senha atualizada com sucesso! Redirecionando para o dashboard...
                </AlertDescription>
              </Alert>
            </div>
          )}

          {phase === "form" && (
            <form onSubmit={handleSubmit} className="w-full grid gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    name="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repita a senha"
                    required
                    minLength={6}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Nova Senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
