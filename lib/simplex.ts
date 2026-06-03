export type ObjectiveType = "maximize" | "minimize"
export type ConstraintType = "<=" | ">=" | "="

export interface Constraint {
  coefficients: number[]
  type: ConstraintType
  rhs: number
}

export interface SimplexProblem {
  objective: ObjectiveType
  objectiveCoefficients: number[]
  constraints: Constraint[]
  numVariables: number
}

export interface TableauRow {
  basicVar: string
  coefficients: number[]
  rhs: number
  ratio?: number | null
}

export interface SimplexTableau {
  headers: string[]
  rows: TableauRow[]
  zRow: number[]
  zValue: number
  pivotColumn?: number
  pivotRow?: number
  pivotElement?: number
  iteration: number
  isOptimal: boolean
  description: string
}

export interface SimplexSolution {
  tableaus: SimplexTableau[]
  standardForm: string[]
  optimalValues: Record<string, number>
  optimalZ: number
  isUnbounded: boolean
  hasNoSolution: boolean
  originalObjective: ObjectiveType
}

export function solveSimplex(problem: SimplexProblem): SimplexSolution {
  const tableaus: SimplexTableau[] = []
  const standardForm: string[] = []
  
  // Track variable information
  let slackCount = 0
  let surplusCount = 0
  let artificialCount = 0
  const artificialVars: number[] = []
  
  // Build standard form
  const numOriginalVars = problem.numVariables
  let totalVars = numOriginalVars
  
  // Count additional variables needed
  for (const constraint of problem.constraints) {
    if (constraint.type === "<=") {
      slackCount++
      totalVars++
    } else if (constraint.type === ">=") {
      surplusCount++
      artificialCount++
      totalVars += 2
    } else if (constraint.type === "=") {
      artificialCount++
      totalVars++
    }
  }
  
  // Build headers
  const headers: string[] = []
  for (let i = 1; i <= numOriginalVars; i++) {
    headers.push(`x${i}`)
  }
  
  let slackIdx = 1
  let surplusIdx = 1
  let artificialIdx = 1
  
  // Create extended coefficient matrix
  const matrix: number[][] = []
  const rhsValues: number[] = []
  const basicVars: string[] = []
  
  let currentExtraCol = numOriginalVars
  
  for (let i = 0; i < problem.constraints.length; i++) {
    const constraint = problem.constraints[i]
    const row: number[] = [...constraint.coefficients]
    
    // Pad with zeros for all extra variables
    while (row.length < totalVars) {
      row.push(0)
    }
    
    if (constraint.type === "<=") {
      const slackVarName = `s${slackIdx}`
      headers.push(slackVarName)
      row[currentExtraCol] = 1
      basicVars.push(slackVarName)
      currentExtraCol++
      slackIdx++
      standardForm.push(
        `Restricción ${i + 1}: Se agrega variable de holgura ${slackVarName}`
      )
    } else if (constraint.type === ">=") {
      const surplusVarName = `e${surplusIdx}`
      const artificialVarName = `a${artificialIdx}`
      headers.push(surplusVarName)
      headers.push(artificialVarName)
      row[currentExtraCol] = -1
      row[currentExtraCol + 1] = 1
      artificialVars.push(currentExtraCol + 1)
      basicVars.push(artificialVarName)
      currentExtraCol += 2
      surplusIdx++
      artificialIdx++
      standardForm.push(
        `Restricción ${i + 1}: Se agrega variable de exceso ${surplusVarName} y variable artificial ${artificialVarName}`
      )
    } else if (constraint.type === "=") {
      const artificialVarName = `a${artificialIdx}`
      headers.push(artificialVarName)
      row[currentExtraCol] = 1
      artificialVars.push(currentExtraCol)
      basicVars.push(artificialVarName)
      currentExtraCol++
      artificialIdx++
      standardForm.push(
        `Restricción ${i + 1}: Se agrega variable artificial ${artificialVarName}`
      )
    }
    
    matrix.push(row)
    rhsValues.push(constraint.rhs)
  }
  
  // Build Z row (objective function coefficients)
  // For maximization: Z - c1*x1 - c2*x2 - ... = 0
  // For minimization: We convert to max(-Z) or handle directly
  let zRow: number[] = new Array(totalVars).fill(0)
  let zValue = 0
  const isMinimization = problem.objective === "minimize"
  
  for (let i = 0; i < numOriginalVars; i++) {
    if (isMinimization) {
      zRow[i] = problem.objectiveCoefficients[i] // For min, we keep positive
    } else {
      zRow[i] = -problem.objectiveCoefficients[i] // For max, negate
    }
  }
  
  // Big M method for artificial variables
  const M = 1000000
  
  if (artificialVars.length > 0) {
    // Add M penalty for artificial variables in Z row
    for (const artIdx of artificialVars) {
      if (isMinimization) {
        zRow[artIdx] = M
      } else {
        zRow[artIdx] = M
      }
    }
    
    // Eliminate artificial variables from Z row
    for (let i = 0; i < matrix.length; i++) {
      const basicVarName = basicVars[i]
      if (basicVarName.startsWith('a')) {
        for (let j = 0; j < totalVars; j++) {
          if (isMinimization) {
            zRow[j] -= M * matrix[i][j]
          } else {
            zRow[j] -= M * matrix[i][j]
          }
        }
        if (isMinimization) {
          zValue -= M * rhsValues[i]
        } else {
          zValue -= M * rhsValues[i]
        }
      }
    }
  }
  
  // Build objective function string
  let objStr = problem.objective === "maximize" ? "Maximizar" : "Minimizar"
  objStr += " Z = "
  const terms: string[] = []
  for (let i = 0; i < numOriginalVars; i++) {
    const coef = problem.objectiveCoefficients[i]
    if (coef !== 0) {
      if (terms.length === 0) {
        terms.push(`${coef}x${i + 1}`)
      } else {
        terms.push(`${coef >= 0 ? "+" : ""}${coef}x${i + 1}`)
      }
    }
  }
  standardForm.unshift(objStr + terms.join(" "))
  
  // Create initial tableau
  const createTableau = (
    iteration: number,
    description: string,
    pivotCol?: number,
    pivotRow?: number
  ): SimplexTableau => {
    const rows: TableauRow[] = matrix.map((row, idx) => ({
      basicVar: basicVars[idx],
      coefficients: [...row],
      rhs: rhsValues[idx],
      ratio: null
    }))
    
    // Calculate ratios if pivot column is defined
    if (pivotCol !== undefined) {
      for (let i = 0; i < rows.length; i++) {
        const pivotColVal = matrix[i][pivotCol]
        if (pivotColVal > 0) {
          rows[i].ratio = rhsValues[i] / pivotColVal
        } else {
          rows[i].ratio = null
        }
      }
    }
    
    return {
      headers: [...headers],
      rows,
      zRow: [...zRow],
      zValue,
      pivotColumn: pivotCol,
      pivotRow,
      pivotElement: pivotCol !== undefined && pivotRow !== undefined 
        ? matrix[pivotRow][pivotCol] 
        : undefined,
      iteration,
      isOptimal: false,
      description
    }
  }
  
  // Check optimality
  const isOptimal = (): boolean => {
    if (isMinimization) {
      // For minimization, optimal when all Z row coefficients <= 0
      return zRow.every(c => c <= 1e-10)
    } else {
      // For maximization, optimal when all Z row coefficients >= 0
      return zRow.every(c => c >= -1e-10)
    }
  }
  
  // Find entering variable (pivot column)
  const findPivotColumn = (): number => {
    let pivotCol = -1
    if (isMinimization) {
      // Find most positive coefficient
      let maxVal = 1e-10
      for (let i = 0; i < zRow.length; i++) {
        if (zRow[i] > maxVal) {
          maxVal = zRow[i]
          pivotCol = i
        }
      }
    } else {
      // Find most negative coefficient
      let minVal = -1e-10
      for (let i = 0; i < zRow.length; i++) {
        if (zRow[i] < minVal) {
          minVal = zRow[i]
          pivotCol = i
        }
      }
    }
    return pivotCol
  }
  
  // Find leaving variable (pivot row) using minimum ratio test
  const findPivotRow = (pivotCol: number): number => {
    let pivotRow = -1
    let minRatio = Infinity
    
    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i][pivotCol] > 1e-10) {
        const ratio = rhsValues[i] / matrix[i][pivotCol]
        if (ratio >= 0 && ratio < minRatio) {
          minRatio = ratio
          pivotRow = i
        }
      }
    }
    
    return pivotRow
  }
  
  // Add initial tableau
  tableaus.push(createTableau(0, "Tabla inicial (Forma Estándar)"))
  
  let iteration = 0
  const maxIterations = 100
  
  while (!isOptimal() && iteration < maxIterations) {
    iteration++
    
    const pivotCol = findPivotColumn()
    if (pivotCol === -1) break
    
    const pivotRow = findPivotRow(pivotCol)
    
    if (pivotRow === -1) {
      // Unbounded solution
      const tableau = createTableau(
        iteration,
        `Iteración ${iteration}: Solución no acotada (todos los coeficientes en la columna pivote son ≤ 0)`,
        pivotCol
      )
      tableaus.push(tableau)
      return {
        tableaus,
        standardForm,
        optimalValues: {},
        optimalZ: isMinimization ? -Infinity : Infinity,
        isUnbounded: true,
        hasNoSolution: false,
        originalObjective: problem.objective
      }
    }
    
    // Add tableau showing pivot selection
    const pivotTableau = createTableau(
      iteration,
      `Iteración ${iteration}: Variable entrante = ${headers[pivotCol]}, Variable saliente = ${basicVars[pivotRow]}`,
      pivotCol,
      pivotRow
    )
    tableaus.push(pivotTableau)
    
    // Perform pivot operation
    const pivotElement = matrix[pivotRow][pivotCol]
    
    // Normalize pivot row
    for (let j = 0; j < totalVars; j++) {
      matrix[pivotRow][j] /= pivotElement
    }
    rhsValues[pivotRow] /= pivotElement
    
    // Update other rows
    for (let i = 0; i < matrix.length; i++) {
      if (i !== pivotRow) {
        const factor = matrix[i][pivotCol]
        for (let j = 0; j < totalVars; j++) {
          matrix[i][j] -= factor * matrix[pivotRow][j]
        }
        rhsValues[i] -= factor * rhsValues[pivotRow]
      }
    }
    
    // Update Z row
    const zFactor = zRow[pivotCol]
    for (let j = 0; j < totalVars; j++) {
      zRow[j] -= zFactor * matrix[pivotRow][j]
    }
    zValue -= zFactor * rhsValues[pivotRow]
    
    // Update basic variable
    basicVars[pivotRow] = headers[pivotCol]
  }
  
  // Check for artificial variables in basis with non-zero values
  let hasArtificialInBasis = false
  for (let i = 0; i < basicVars.length; i++) {
    if (basicVars[i].startsWith('a') && Math.abs(rhsValues[i]) > 1e-10) {
      hasArtificialInBasis = true
      break
    }
  }
  
  if (hasArtificialInBasis) {
    const finalTableau = createTableau(
      iteration + 1,
      "Sin solución factible (variables artificiales en la base con valor > 0)"
    )
    finalTableau.isOptimal = true
    tableaus.push(finalTableau)
    
    return {
      tableaus,
      standardForm,
      optimalValues: {},
      optimalZ: 0,
      isUnbounded: false,
      hasNoSolution: true,
      originalObjective: problem.objective
    }
  }
  
  // Add final optimal tableau
  const finalTableau = createTableau(iteration + 1, "¡Solución óptima encontrada!")
  finalTableau.isOptimal = true
  tableaus.push(finalTableau)
  
  // Extract optimal values
  const optimalValues: Record<string, number> = {}
  for (let i = 1; i <= numOriginalVars; i++) {
    const varName = `x${i}`
    const rowIdx = basicVars.indexOf(varName)
    if (rowIdx !== -1) {
      optimalValues[varName] = Math.round(rhsValues[rowIdx] * 10000) / 10000
    } else {
      optimalValues[varName] = 0
    }
  }
  
  // Calculate optimal Z
  let optimalZ = 0
  for (let i = 0; i < numOriginalVars; i++) {
    optimalZ += problem.objectiveCoefficients[i] * (optimalValues[`x${i + 1}`] || 0)
  }
  optimalZ = Math.round(optimalZ * 10000) / 10000
  
  return {
    tableaus,
    standardForm,
    optimalValues,
    optimalZ,
    isUnbounded: false,
    hasNoSolution: false,
    originalObjective: problem.objective
  }
}
