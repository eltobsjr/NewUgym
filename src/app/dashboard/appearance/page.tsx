
"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const themes = [
  { name: "Ugym", className: "ugym", primary: "hsl(15, 95%, 53%)", accent: "hsl(0, 84%, 60%)" },
  { name: "Florest", className: "forest", primary: "hsl(142.1 76.2% 36.3%)", accent: "hsl(164.3 87.5% 35.5%)" },
  { name: "Oceano", className: "ocean", primary: "hsl(221.2 83.2% 53.3%)", accent: "hsl(210 90% 50%)" },
  { name: "Vibração", className: "vibe", primary: "hsl(327.7 82.2% 55.7%)", accent: "hsl(262.1 83.3% 57.8%)" },
]

export default function AppearancePage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // or a skeleton loader
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Aparência</h1>
      
      <Card>
          <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>Selecione o modo de cor para a interface.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
              <button onClick={() => setTheme("light")} className={cn("border-2 p-2 rounded-md", resolvedTheme === "light" ? "border-primary" : "border-transparent")}>
                  <div className="w-20 h-12 rounded-sm bg-gray-200" />
                  <p className="text-sm mt-2">Claro</p>
              </button>
               <button onClick={() => setTheme("dark")} className={cn("border-2 p-2 rounded-md", resolvedTheme === "dark" ? "border-primary" : "border-transparent")}>
                  <div className="w-20 h-12 rounded-sm bg-gray-800" />
                  <p className="text-sm mt-2">Escuro</p>
              </button>
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Paleta de Cores</CardTitle>
          <CardDescription>Escolha uma paleta de cores para personalizar sua experiência.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {themes.map((t) => (
              <div key={t.name} className="relative">
                <button
                  onClick={() => setTheme(t.className)}
                  className={cn(
                    "w-full h-24 rounded-lg border-2 flex flex-col items-center justify-center text-center transition-all",
                    theme === t.className ? "border-primary" : "border-muted"
                  )}
                >
                  <div className="flex gap-2">
                     <div className="h-8 w-8 rounded-full" style={{ backgroundColor: t.primary }} />
                     <div className="h-8 w-8 rounded-full" style={{ backgroundColor: t.accent }} />
                  </div>
                  {theme === t.className && (
                    <div className="absolute top-2 right-2 p-1 bg-primary rounded-full">
                       <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
                <p className="text-sm font-medium text-center mt-2">{t.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
