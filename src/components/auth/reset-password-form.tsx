"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Não foi possível enviar o email. Tente novamente.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Dumbbell className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Ugym</h1>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Recuperar Senha</h2>
        <p className="text-muted-foreground mt-1">
          Informe seu email e enviaremos um link para criar uma nova senha.
        </p>
      </div>

      {success ? (
        <div className="w-full space-y-4">
          <Alert>
            <AlertDescription>
              Email enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </AlertDescription>
          </Alert>
          <Link href="/login" className="block text-center text-sm text-primary hover:underline">
            Voltar ao login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              disabled={isLoading}
              className="bg-background/70"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Lembrou a senha?{" "}
            <Link href="/login" className="font-semibold text-primary/90 hover:text-primary">
              Fazer login
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
