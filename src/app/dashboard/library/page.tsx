
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { describeExercise, DescribeExerciseOutput } from '@/ai/flows/describe-exercise-flow';
import { Loader2, Search, Dumbbell, Target, ShieldCheck } from 'lucide-react';

export default function ExerciseLibraryPage() {
  const [exerciseName, setExerciseName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseDetails, setExerciseDetails] = useState<DescribeExerciseOutput | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    setIsLoading(true);
    setExerciseDetails(null);

    try {
      const details = await describeExercise({ exerciseName });
      setExerciseDetails(details);
    } catch (error) {
      console.error('Failed to fetch exercise description:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar exercício',
        description: 'Não foi possível obter os detalhes para este exercício. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Biblioteca de Exercícios com IA</h1>
        <p className="text-muted-foreground">
          Digite o nome de um exercício para obter uma descrição detalhada, músculos trabalhados e dicas de execução.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex w-full max-w-lg gap-2">
        <Input
          type="search"
          placeholder="Ex: Agachamento com Barra, Rosca Direta..."
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Buscar
        </Button>
      </form>

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">A IA está buscando os detalhes do exercício... Isso pode levar alguns segundos.</p>
        </div>
      )}

      {exerciseDetails && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl">{exerciseDetails.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
               <Image
                    src={exerciseDetails.media.gifUrl}
                    alt={`Animação do exercício ${exerciseDetails.name}`}
                    width={300}
                    height={300}
                    className="w-full h-auto rounded-lg object-cover bg-muted"
                    unoptimized // Necessary for GIFs in next/image
                    data-ai-hint="exercise fitness"
                />
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                 <h3 className="flex items-center gap-2 font-semibold text-lg"><Dumbbell className="h-5 w-5 text-primary"/> Execução Correta</h3>
                 <p className="text-muted-foreground whitespace-pre-wrap">{exerciseDetails.description}</p>
              </div>

              <div className="space-y-2">
                 <h3 className="flex items-center gap-2 font-semibold text-lg"><Target className="h-5 w-5 text-primary"/> Músculos Trabalhados</h3>
                 <div className="flex flex-wrap gap-2">
                    {exerciseDetails.musclesWorked.map(muscle => (
                        <div key={muscle} className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">{muscle}</div>
                    ))}
                 </div>
              </div>

               <div className="space-y-2">
                 <h3 className="flex items-center gap-2 font-semibold text-lg"><ShieldCheck className="h-5 w-5 text-primary"/> Dicas de Segurança</h3>
                 <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {exerciseDetails.safetyTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                    ))}
                 </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
