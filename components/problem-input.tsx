"use client"

import { useState } from "react"
import type { ObjectiveType, ConstraintType, SimplexProblem } from "@/lib/simplex"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Minus, Play, RotateCcw, Target, Sliders } from "lucide-react"

interface ProblemInputProps {
  onSolve: (problem: SimplexProblem) => void
  onReset: () => void
}

export function ProblemInput({ onSolve, onReset }: ProblemInputProps) {
  const [objective, setObjective] = useState<ObjectiveType>("maximize")
  const [numVariables, setNumVariables] = useState(2)
  const [numConstraints, setNumConstraints] = useState(2)
  const [objectiveCoefficients, setObjectiveCoefficients] = useState<number[]>([3, 2])
  const [constraints, setConstraints] = useState<{
    coefficients: number[]
    type: ConstraintType
    rhs: number
  }[]>([
    { coefficients: [1, 1], type: "<=", rhs: 4 },
    { coefficients: [2, 1], type: "<=", rhs: 6 },
  ])

  const updateNumVariables = (newNum: number) => {
    if (newNum < 1 || newNum > 10) return
    
    const diff = newNum - numVariables
    
    if (diff > 0) {
      setObjectiveCoefficients([...objectiveCoefficients, ...Array(diff).fill(0)])
      setConstraints(constraints.map(c => ({
        ...c,
        coefficients: [...c.coefficients, ...Array(diff).fill(0)]
      })))
    } else {
      setObjectiveCoefficients(objectiveCoefficients.slice(0, newNum))
      setConstraints(constraints.map(c => ({
        ...c,
        coefficients: c.coefficients.slice(0, newNum)
      })))
    }
    
    setNumVariables(newNum)
  }

  const updateNumConstraints = (newNum: number) => {
    if (newNum < 1 || newNum > 10) return
    
    const diff = newNum - numConstraints
    
    if (diff > 0) {
      const newConstraints = Array(diff).fill(null).map(() => ({
        coefficients: Array(numVariables).fill(0),
        type: "<=" as ConstraintType,
        rhs: 0
      }))
      setConstraints([...constraints, ...newConstraints])
    } else {
      setConstraints(constraints.slice(0, newNum))
    }
    
    setNumConstraints(newNum)
  }

  const updateObjectiveCoef = (idx: number, value: string) => {
    const num = parseFloat(value) || 0
    const newCoefs = [...objectiveCoefficients]
    newCoefs[idx] = num
    setObjectiveCoefficients(newCoefs)
  }

  const updateConstraintCoef = (constraintIdx: number, varIdx: number, value: string) => {
    const num = parseFloat(value) || 0
    const newConstraints = [...constraints]
    newConstraints[constraintIdx].coefficients[varIdx] = num
    setConstraints(newConstraints)
  }

  const updateConstraintType = (idx: number, type: ConstraintType) => {
    const newConstraints = [...constraints]
    newConstraints[idx].type = type
    setConstraints(newConstraints)
  }

  const updateConstraintRHS = (idx: number, value: string) => {
    const num = parseFloat(value) || 0
    const newConstraints = [...constraints]
    newConstraints[idx].rhs = num
    setConstraints(newConstraints)
  }

  const handleSolve = () => {
    const problem: SimplexProblem = {
      objective,
      objectiveCoefficients,
      constraints: constraints.map(c => ({
        coefficients: c.coefficients,
        type: c.type,
        rhs: c.rhs
      })),
      numVariables
    }
    onSolve(problem)
  }

  const handleReset = () => {
    setObjective("maximize")
    setNumVariables(2)
    setNumConstraints(2)
    setObjectiveCoefficients([3, 2])
    setConstraints([
      { coefficients: [1, 1], type: "<=", rhs: 4 },
      { coefficients: [2, 1], type: "<=", rhs: 6 },
    ])
    onReset()
  }

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sliders className="w-5 h-5" />
            Configuración del Problema
          </CardTitle>
          <CardDescription>
            Define el tipo de optimización y las dimensiones del problema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo</Label>
              <Select value={objective} onValueChange={(v) => setObjective(v as ObjectiveType)}>
                <SelectTrigger id="objective">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maximize">Maximizar</SelectItem>
                  <SelectItem value="minimize">Minimizar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Variables de Decisión</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateNumVariables(numVariables - 1)}
                  disabled={numVariables <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-lg">{numVariables}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateNumVariables(numVariables + 1)}
                  disabled={numVariables >= 10}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Restricciones</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateNumConstraints(numConstraints - 1)}
                  disabled={numConstraints <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-lg">{numConstraints}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateNumConstraints(numConstraints + 1)}
                  disabled={numConstraints >= 10}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objective Function Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5" />
            Función Objetivo
          </CardTitle>
          <CardDescription>
            {objective === "maximize" ? "Maximizar" : "Minimizar"} Z = 
            {objectiveCoefficients.map((c, i) => {
              const sign = i === 0 ? "" : c >= 0 ? " + " : " "
              return `${sign}${c}x${i + 1}`
            }).join("")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-muted-foreground">Z =</span>
            {objectiveCoefficients.map((coef, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {idx > 0 && <span className="text-muted-foreground">+</span>}
                <Input
                  type="number"
                  value={coef}
                  onChange={(e) => updateObjectiveCoef(idx, e.target.value)}
                  className="w-20 text-center"
                />
                <span className="font-medium">x<sub>{idx + 1}</sub></span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Constraints Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Restricciones</CardTitle>
          <CardDescription>
            Ingresa los coeficientes de cada restricción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Restricción</TableHead>
                  {Array.from({ length: numVariables }, (_, i) => (
                    <TableHead key={i} className="text-center min-w-20">
                      x<sub>{i + 1}</sub>
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-24">Tipo</TableHead>
                  <TableHead className="text-center min-w-20">RHS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constraints.map((constraint, cIdx) => (
                  <TableRow key={cIdx}>
                    <TableCell className="font-medium">R{cIdx + 1}</TableCell>
                    {constraint.coefficients.map((coef, vIdx) => (
                      <TableCell key={vIdx}>
                        <Input
                          type="number"
                          value={coef}
                          onChange={(e) => updateConstraintCoef(cIdx, vIdx, e.target.value)}
                          className="w-full text-center"
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Select
                        value={constraint.type}
                        onValueChange={(v) => updateConstraintType(cIdx, v as ConstraintType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<=">≤</SelectItem>
                          <SelectItem value=">=">≥</SelectItem>
                          <SelectItem value="=">=</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={constraint.rhs}
                        onChange={(e) => updateConstraintRHS(cIdx, e.target.value)}
                        className="w-full text-center"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSolve} size="lg" className="gap-2">
          <Play className="w-4 h-4" />
          Resolver
        </Button>
        <Button onClick={handleReset} variant="outline" size="lg" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reiniciar
        </Button>
      </div>
    </div>
  )
}
