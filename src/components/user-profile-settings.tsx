
'use client';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { UserRole, User } from "@/contexts/user-role-context";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(" ");
    const firstInitial = names[0]?.[0] || "";
    const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] || "" : "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
};

const StudentProfileForm = ({ user }: { user: User }) => (
    <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} />
            </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input id="height" type="number" placeholder="Ex: 175" defaultValue={user.height} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input id="weight" type="number" placeholder="Ex: 80" defaultValue={user.weight} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="birthdate">Data de Nascimento</Label>
                <Input id="birthdate" type="date" defaultValue={user.birthdate} />
            </div>
        </div>
    </div>
);

const TrainerProfileForm = ({ user }: { user: User }) => (
    <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} />
            </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="cref">CREF</Label>
                <Input id="cref" placeholder="Ex: 123456-G/SP" defaultValue={user.cref} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="specializations">Especializações</Label>
                <Input id="specializations" placeholder="Ex: Treinamento Funcional" defaultValue={user.specializations} />
            </div>
        </div>
         <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea id="bio" placeholder="Fale um pouco sobre sua carreira e filosofia de treino..." defaultValue={user.bio} />
        </div>
    </div>
);

const renderProfileForm = (role: UserRole, user: User) => {
    switch (role) {
        case "Student":
            return <StudentProfileForm user={user} />;
        case "Trainer":
            return <TrainerProfileForm user={user} />;
        default:
            return null;
    }
}


export function UserProfileSettings({ user, role }: { user: User, role: UserRole }) {
    const { toast } = useToast();

    const handleSaveChanges = () => {
        toast({
          title: "Perfil Atualizado",
          description: "Suas informações foram salvas com sucesso.",
        });
    };

    return (
        <Card className="overflow-hidden">
             <div className="relative h-32 md:h-48 w-full bg-muted">
                <Image
                    src="https://placehold.co/1200x400.png"
                    alt="Banner do perfil"
                    fill
                    style={{objectFit: "cover"}}
                />
            </div>
            <CardHeader className="flex-col items-start gap-4 sm:flex-row p-6">
                <div className="relative -mt-20 sm:-mt-24">
                    <Avatar className="h-28 w-28 border-4 border-background">
                         <AvatarImage src={`https://placehold.co/100x100.png`} alt={user.name} data-ai-hint="person portrait"/>
                        <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1">
                    <CardTitle className="text-3xl">{user.name}</CardTitle>
                    <CardDescription>
                        {role} @ Ugym
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {renderProfileForm(role, user)}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
            </CardFooter>
        </Card>
    );
}
