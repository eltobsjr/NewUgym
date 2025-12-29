
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SignupForm() {
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/dashboard");
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

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first-name">Nome</Label>
            <Input id="first-name" placeholder="Max" required className="bg-background/70" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-name">Sobrenome</Label>
            <Input id="last-name" placeholder="Robinson" required className="bg-background/70" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            className="bg-background/70"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" required className="bg-background/70" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Eu sou...</Label>
          <Select name="role" required>
            <SelectTrigger id="role" className="bg-background/70">
              <SelectValue placeholder="Selecione seu perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Student">Aluno</SelectItem>
              <SelectItem value="Trainer">Personal Trainer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full">
          Criar Conta
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link href="/" className="font-semibold text-primary/90 hover:text-primary">
          Faça login
        </Link>
      </p>
    </div>
  );
}
