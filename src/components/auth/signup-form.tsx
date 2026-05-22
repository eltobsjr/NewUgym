
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState('Student');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const firstName = formData.get('first-name') as string;
    const lastName = formData.get('last-name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta. Tente novamente.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
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
            <h2 className="text-2xl font-bold tracking-tight">Crie sua Conta</h2>
            <p className="text-muted-foreground mt-1">
                Comece hoje mesmo a transformar seus treinos.
            </p>
        </div>

      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first-name">Nome</Label>
            <Input
              id="first-name"
              name="first-name"
              placeholder="Maria"
              required
              disabled={isLoading}
              className="bg-background/70"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-name">Sobrenome</Label>
            <Input
              id="last-name"
              name="last-name"
              placeholder="Silva"
              required
              disabled={isLoading}
              className="bg-background/70"
            />
          </div>
        </div>
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
        <div className="grid gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading}
            minLength={6}
            className="bg-background/70"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Eu sou...</Label>
          <Select value={role} onValueChange={setRole} disabled={isLoading}>
            <SelectTrigger id="role" className="bg-background/70">
              <SelectValue placeholder="Selecione seu perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Student">Aluno</SelectItem>
              <SelectItem value="Trainer">Personal Trainer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Criando conta...' : 'Criar Conta'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-semibold text-primary/90 hover:text-primary">
          Faça login
        </Link>
      </p>
    </div>
  );
}
