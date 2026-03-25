export type CalculationType = "FIXED" | "PERCENTAGE";
export type PercentageBasis = "BASIC" | "GROSS";

export interface SalaryComponentInput {
  componentId: number;
  componentCode: string;
  componentName: string;
  type: "Earning" | "Deduction";
  calculationType: CalculationType;
  percentageBasis: PercentageBasis | null;
  value: number;
}

export interface CalculatedComponent extends SalaryComponentInput {
  calculatedAmount: number;
}

/**
 * Deterministically calculates a full salary breakdown on the frontend.
 * This mirrors the backend's calculation logic to ensure 100% consistency.
 */
export function calculateSalaryPreview(
  grossSalary: number,
  components: SalaryComponentInput[]
): CalculatedComponent[] {
  const round2 = (val: number) => Math.round(val * 100) / 100;

  if (grossSalary <= 0) return [];

  const earnings: SalaryComponentInput[] = [];
  const deductions: SalaryComponentInput[] = [];

  for (const c of components) {
    if (c.type === "Earning") earnings.push(c);
    else deductions.push(c);
  }

  const basicComponent = earnings.find((c) => c.componentCode === "BASIC");
  const specialAllowanceCode = "SPECIAL_ALLOWANCE";
  const specialAllowance = earnings.find((c) => c.componentCode === specialAllowanceCode);

  const result: CalculatedComponent[] = [];

  // 1. Calculate BASIC first
  let basicAmount = 0;
  if (basicComponent) {
    if (basicComponent.calculationType === "FIXED") {
      basicAmount = Number(basicComponent.value) || 0;
    } else {
      // Basic must be on Gross
      basicAmount = ((Number(basicComponent.value) || 0) / 100) * grossSalary;
    }
    basicAmount = round2(basicAmount);
    result.push({ ...basicComponent, calculatedAmount: basicAmount });
  }

  // 2. Process all Earnings (except BASIC and Special Allowance)
  let currentEarningsTotal = basicAmount;

  const otherEarnings = earnings
    .filter((c) => c.componentCode !== "BASIC" && c.componentCode !== specialAllowanceCode)
    .sort((a, b) => a.componentId - b.componentId);

  for (const comp of otherEarnings) {
    let amount = 0;
    if (comp.calculationType === "FIXED") {
      amount = Number(comp.value) || 0;
    } else {
      const basis = comp.percentageBasis === "BASIC" ? basicAmount : grossSalary;
      amount = ((Number(comp.value) || 0) / 100) * basis;
    }
    amount = round2(amount);
    result.push({ ...comp, calculatedAmount: amount });
    currentEarningsTotal += amount;
  }

  // 3. Auto-balance with Special Allowance
  currentEarningsTotal = round2(currentEarningsTotal);
  const remaining = round2(grossSalary - currentEarningsTotal);

  if (specialAllowance) {
    // In preview, we always force matching if Special Allowance exists
    const specialAmount = remaining; 
    result.push({ 
      ...specialAllowance, 
      calculatedAmount: round2(specialAmount)
    });
  }

  // 4. Process Deductions
  for (const comp of deductions.sort((a, b) => a.componentId - b.componentId)) {
    let amount = 0;
    if (comp.calculationType === "FIXED") {
      amount = Number(comp.value) || 0;
    } else {
      const basis = comp.percentageBasis === "BASIC" ? basicAmount : grossSalary;
      amount = ((Number(comp.value) || 0) / 100) * basis;
    }
    amount = round2(amount);
    result.push({ ...comp, calculatedAmount: amount });
  }

  return result;
}
