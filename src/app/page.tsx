"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Dumbbell, LineChart, Sparkles, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            NewUgym
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Funcionalidades</Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">Como Funciona</Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Planos</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button>Começar Agora</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              className="flex-1 text-center lg:text-left"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={fadeIn} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-6">
                <Sparkles className="mr-1 h-3 w-3" />
                Potencializado por IA
              </motion.div>
              <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                Transforme seu corpo com <span className="text-primary">Inteligência</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                A plataforma completa para Personal Trainers e Alunos. Treinos personalizados, acompanhamento em tempo real e gestão financeira simplificada.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-12 px-8 text-lg">
                    Começar Gratuitamente <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full h-12 px-8 text-lg">
                    Saber Mais
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="flex-1 relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative w-full aspect-square max-w-[500px] mx-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative bg-card border rounded-2xl shadow-2xl p-6 overflow-hidden">
                  {/* Mock UI Elements */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                      <div className="h-2 w-24 bg-muted rounded" />
                      <div className="h-2 w-16 bg-muted rounded" />
                    </div>
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="h-10 w-10 rounded-md bg-background flex items-center justify-center shadow-sm">
                          {i === 1 ? <Zap className="h-5 w-5 text-yellow-500" /> : 
                           i === 2 ? <LineChart className="h-5 w-5 text-blue-500" /> : 
                           <Users className="h-5 w-5 text-green-500" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-2 w-full bg-muted-foreground/20 rounded" />
                          <div className="h-2 w-2/3 bg-muted-foreground/20 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                            U{i}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        +500 Alunos ativos
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-lg text-muted-foreground">
              Ferramentas poderosas para Personal Trainers escalarem seus negócios e para Alunos alcançarem seus objetivos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="h-6 w-6 text-primary" />,
                title: "Treinos com IA",
                description: "Gere planos de treino completos e personalizados em segundos com nossa inteligência artificial avançada."
              },
              {
                icon: <LineChart className="h-6 w-6 text-blue-500" />,
                title: "Acompanhamento de Progresso",
                description: "Visualize a evolução com gráficos detalhados de medidas, peso e performance nos exercícios."
              },
              {
                icon: <Users className="h-6 w-6 text-green-500" />,
                title: "Gestão de Alunos",
                description: "Organize seus alunos, atribua treinos e monitore o engajamento em um painel intuitivo."
              },
              {
                icon: <Zap className="h-6 w-6 text-yellow-500" />,
                title: "Financeiro Integrado",
                description: "Controle pagamentos, mensalidades e inadimplência sem precisar de planilhas externas."
              },
              {
                icon: <Dumbbell className="h-6 w-6 text-purple-500" />,
                title: "Biblioteca de Exercícios",
                description: "Acesso a centenas de exercícios com vídeos e instruções, ou adicione os seus próprios."
              },
              {
                icon: <CheckCircle2 className="h-6 w-6 text-red-500" />,
                title: "Feedback em Tempo Real",
                description: "Comunicação direta entre treinador e aluno para ajustes rápidos e motivação constante."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-background border flex items-center justify-center mb-4 shadow-sm">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Funciona</h2>
            <p className="text-lg text-muted-foreground">Simples, rápido e eficiente.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-border -z-10" />

            {[
              { step: "1", title: "Cadastre-se", desc: "Crie sua conta como Personal ou Aluno em menos de 1 minuto." },
              { step: "2", title: "Defina Objetivos", desc: "Configure metas e preferências para personalizar a experiência." },
              { step: "3", title: "Comece a Treinar", desc: "Acesse treinos, registre progresso e veja resultados." }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                className="flex flex-col items-center text-center bg-background"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border-4 border-background shadow-sm z-10">
                  <span className="text-3xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground max-w-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para transformar sua rotina de treinos?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de personal trainers e alunos que já estão usando o NewUgym.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-primary-foreground" />
                </div>
                NewUgym
              </div>
              <p className="text-muted-foreground max-w-sm">
                A plataforma definitiva para gestão de treinos e evolução física. Tecnologia e saúde caminhando juntas.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Funcionalidades</Link></li>
                <li><Link href="#" className="hover:text-primary">Preços</Link></li>
                <li><Link href="#" className="hover:text-primary">Para Personais</Link></li>
                <li><Link href="#" className="hover:text-primary">Para Alunos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Termos de Uso</Link></li>
                <li><Link href="#" className="hover:text-primary">Privacidade</Link></li>
                <li><Link href="#" className="hover:text-primary">Contato</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NewUgym. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
