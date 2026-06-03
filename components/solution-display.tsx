"use client"

import type { SimplexSolution } from "@/lib/simplex"
import { SimplexTableauDisplay } from "./simplex-tableau"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Table2, 
  Trophy,
  ArrowRight
} from "lucide-react"

interface SolutionDisplayProps {
  solution: SimplexSolution
}

export function SolutionDisplay({ solution }: SolutionDisplayProps) {
  const formatNumber = (num: number): string => {
    if (Math.abs(num - Math.round(num)) < 1e-10) {
      return Math.round(num).toString()
    }
    return num.toFixed(4).replace(/\.?0+$/, "")
  }

  return (
    <div className="space-y-6">
      {/* Standard Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            Forma Estándar
          </CardTitle>
          <CardDescription>
            Transformación del problema a forma estándar para el método Simplex
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm bg-muted/50 p-4 rounded-lg">
            {solution.standardForm.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Iteration Tables */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Table2 className="w-5 h-5" />
            Proceso de Iteración
          </CardTitle>
          <CardDescription>
            Todas las tablas del método Simplex paso a paso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {solution.tableaus.map((tableau, idx) => (
            <div key={idx}>
              <SimplexTableauDisplay tableau={tableau} />
              {idx < solution.tableaus.length - 1 && (
                <Separator className="mt-6" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Final Result */}
      <Card className={
        solution.hasNoSolution || solution.isUnbounded
          ? "border-destructive/50 bg-destructive/5"
          : "border-green-500/50 bg-green-50/50"
      }>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            {solution.hasNoSolution ? (
              <>
                <XCircle className="w-5 h-5 text-destructive" />
                <span className="text-destructive">Sin Solución Factible</span>
              </>
            ) : solution.isUnbounded ? (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-600">Solución No Acotada</span>
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5 text-green-600" />
                <span className="text-green-600">Solución Óptima</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {solution.hasNoSolution ? (
            <p className="text-muted-foreground">
              El problema no tiene solución factible. Las restricciones son inconsistentes
              y no existe una región factible.
            </p>
          ) : solution.isUnbounded ? (
            <p className="text-muted-foreground">
              El problema tiene una solución no acotada. El valor de Z puede crecer 
              {solution.originalObjective === "maximize" ? " indefinidamente hacia +∞" : " indefinidamente hacia -∞"}.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {Object.entries(solution.optimalValues).map(([varName, value]) => (
                  <Badge 
                    key={varName} 
                    variant="secondary" 
                    className="text-base px-4 py-2"
                  >
                    <span className="font-mono">{varName}</span>
                    <span className="mx-2">=</span>
                    <span className="font-bold">{formatNumber(value)}</span>
                  </Badge>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Valor óptimo de Z:</span>
                </div>
                <Badge className="text-lg px-4 py-2 bg-green-600 hover:bg-green-700">
                  Z = {formatNumber(solution.optimalZ)}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mt-2">
                {solution.originalObjective === "maximize" 
                  ? `Se ha encontrado el valor máximo de Z = ${formatNumber(solution.optimalZ)}`
                  : `Se ha encontrado el valor mínimo de Z = ${formatNumber(solution.optimalZ)}`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
