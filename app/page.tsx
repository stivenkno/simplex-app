"use client"

import { useState } from "react"
import type { SimplexProblem, SimplexSolution } from "@/lib/simplex"
import { solveSimplex } from "@/lib/simplex"
import { ProblemInput } from "@/components/problem-input"
import { SolutionDisplay } from "@/components/solution-display"
import { Calculator, BookOpen, Lightbulb } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function SimplexSolver() {
  const [solution, setSolution] = useState<SimplexSolution | null>(null)

  const handleSolve = (problem: SimplexProblem) => {
    const result = solveSimplex(problem)
    setSolution(result)
  }

  const handleReset = () => {
    setSolution(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Calculadora Simplex
              </h1>
              <p className="text-sm text-muted-foreground">
                Método Simplex Primal para Programación Lineal
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="rounded-lg bg-muted/30 border border-border p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="font-semibold text-foreground">
                  ¿Cómo usar esta herramienta?
                </h2>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Selecciona si deseas <strong>Maximizar</strong> o <strong>Minimizar</strong> la función objetivo</li>
                  <li>Define la cantidad de variables de decisión y restricciones</li>
                  <li>Ingresa los coeficientes de la función objetivo (Z)</li>
                  <li>Completa la tabla de restricciones con los coeficientes, tipo de desigualdad y el lado derecho (RHS)</li>
                  <li>Presiona <strong>Resolver</strong> para ver el proceso paso a paso</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Problem Input Section */}
          <section>
            <ProblemInput onSolve={handleSolve} onReset={handleReset} />
          </section>

          {/* Solution Section */}
          {solution && (
            <>
              <Separator className="my-8" />
              
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Solución del Problema
                  </h2>
                </div>
                
                <SolutionDisplay solution={solution} />
              </section>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Calculadora del Método Simplex para Programación Lineal • 
            Desarrollado para resolver problemas de optimización
          </p>
        </div>
      </footer>
    </div>
  )
}
