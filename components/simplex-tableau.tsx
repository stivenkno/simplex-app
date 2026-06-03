"use client"

import type { SimplexTableau } from "@/lib/simplex"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface SimplexTableauProps {
  tableau: SimplexTableau
}

export function SimplexTableauDisplay({ tableau }: SimplexTableauProps) {
  const formatNumber = (num: number): string => {
    if (Math.abs(num) < 1e-10) return "0"
    if (Math.abs(num - Math.round(num)) < 1e-10) {
      return Math.round(num).toString()
    }
    return num.toFixed(4).replace(/\.?0+$/, "")
  }

  const formatRatio = (ratio: number | null | undefined): string => {
    if (ratio === null || ratio === undefined) return "—"
    if (!isFinite(ratio)) return "∞"
    if (ratio < 0) return "—"
    return formatNumber(ratio)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="text-sm">
          {tableau.iteration === 0 ? "Tabla Inicial" : `Iteración ${tableau.iteration}`}
        </Badge>
        {tableau.isOptimal && (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Óptima
          </Badge>
        )}
        {tableau.pivotElement !== undefined && (
          <Badge variant="outline" className="text-xs">
            Elemento Pivote: {formatNumber(tableau.pivotElement)}
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        {tableau.description.includes("no acotada") || tableau.description.includes("Sin solución") ? (
          <AlertCircle className="w-4 h-4 text-destructive" />
        ) : null}
        {tableau.description}
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-foreground w-20">VB</TableHead>
              {tableau.headers.map((header, idx) => (
                <TableHead
                  key={idx}
                  className={`font-semibold text-center min-w-16 ${
                    idx === tableau.pivotColumn
                      ? "bg-primary/20 text-primary"
                      : "text-foreground"
                  }`}
                >
                  {header}
                </TableHead>
              ))}
              <TableHead className="font-semibold text-center min-w-20 text-foreground">RHS</TableHead>
              {tableau.pivotColumn !== undefined && (
                <TableHead className="font-semibold text-center min-w-20 text-foreground">Razón</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableau.rows.map((row, rowIdx) => (
              <TableRow
                key={rowIdx}
                className={
                  rowIdx === tableau.pivotRow
                    ? "bg-accent/30"
                    : rowIdx % 2 === 0
                    ? "bg-background"
                    : "bg-muted/20"
                }
              >
                <TableCell className="font-medium text-foreground">
                  {row.basicVar}
                </TableCell>
                {row.coefficients.map((coef, colIdx) => (
                  <TableCell
                    key={colIdx}
                    className={`text-center ${
                      colIdx === tableau.pivotColumn && rowIdx === tableau.pivotRow
                        ? "bg-primary text-primary-foreground font-bold"
                        : colIdx === tableau.pivotColumn
                        ? "bg-primary/20"
                        : ""
                    }`}
                  >
                    {formatNumber(coef)}
                  </TableCell>
                ))}
                <TableCell className="text-center font-medium">{formatNumber(row.rhs)}</TableCell>
                {tableau.pivotColumn !== undefined && (
                  <TableCell
                    className={`text-center ${
                      rowIdx === tableau.pivotRow ? "font-bold text-primary" : ""
                    }`}
                  >
                    {formatRatio(row.ratio)}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {/* Z Row */}
            <TableRow className="bg-muted font-semibold border-t-2 border-border">
              <TableCell className="text-foreground">Z</TableCell>
              {tableau.zRow.map((coef, colIdx) => (
                <TableCell
                  key={colIdx}
                  className={`text-center ${
                    colIdx === tableau.pivotColumn ? "bg-primary/20" : ""
                  }`}
                >
                  {formatNumber(coef)}
                </TableCell>
              ))}
              <TableCell className="text-center">{formatNumber(tableau.zValue)}</TableCell>
              {tableau.pivotColumn !== undefined && <TableCell />}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      {(tableau.pivotColumn !== undefined || tableau.pivotRow !== undefined) && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary/20 rounded border border-primary/30" />
            <span>Columna Pivote</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-accent/30 rounded border border-accent" />
            <span>Fila Pivote</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded" />
            <span>Elemento Pivote</span>
          </div>
        </div>
      )}
    </div>
  )
}
