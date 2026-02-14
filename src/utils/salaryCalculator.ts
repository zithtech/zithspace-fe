// utils/salaryCalculator.ts
import { Earning, Deduction } from "@/types/salary";

/* ---------- Types ---------- */
export interface SalaryStructureCalc {
  grossSalary: number;
  earnings: Earning[];
  deductions: Deduction[];
  deductionsEnabled: boolean;
}

/* ---------- Earnings ---------- */
export const calculateEarnings = (structure: SalaryStructureCalc) => {
  return structure.earnings.map((e) => ({
    ...e,
    amount: Math.round((structure.grossSalary * e.percentage) / 100),
  }));
};

/* ---------- Basic Pay ---------- */
export const getBasicPay = (structure: SalaryStructureCalc): number => {
  const earnings = calculateEarnings(structure);
  return earnings.find((e) => e.name === "Basic Pay")?.amount || 0;
};

/* ---------- Deduction Amounts ---------- */
export const calculateDeductionAmounts = (
  structure: SalaryStructureCalc
) => {
  if (!structure.deductionsEnabled) return [];

  const basicPay = getBasicPay(structure);

  return structure.deductions.map((d) => {
    let amount = 0;

    if (d.type === "BASIC_PERCENT") {
      amount = Math.round((basicPay * d.value) / 100);
    } else if (d.type === "GROSS_PERCENT") {
      amount = Math.round((structure.grossSalary * d.value) / 100);
    } else {
      amount = d.value;
    }

    return { ...d, amount };
  });
};

/* ---------- Total Deductions ---------- */
export const calculateTotalDeductions = (
  structure: SalaryStructureCalc
): number => {
  if (!structure.deductionsEnabled) return 0;

  return calculateDeductionAmounts(structure).reduce(
    (sum, d) => sum + d.amount,
    0
  );
};

/* ---------- Net Pay ---------- */
export const calculateNetPay = (
  structure: SalaryStructureCalc
): number => {
  return structure.grossSalary - calculateTotalDeductions(structure);
};


export const calculateTotalEarnings = (
  structure: SalaryStructureCalc
): number => {
  return calculateEarnings(structure).reduce(
    (sum, e) => sum + e.amount,
    0
  );
};

// export const getMonthIndex = (date: string): number => {
//   const d = new Date(date);
//   return d.getMonth() + 1; // Jan = 1
// };


// export const calculateEarningsWithYTD = (
//   structure: SalaryStructureCalc,
//   fromDate: string
// ) => {
//   const monthIndex = getMonthIndex(fromDate);

//   return calculateEarnings(structure).map((e) => ({
//     ...e,
//     ytd: e.amount * monthIndex,
//   }));
// };


// export const calculateDeductionsWithYTD = (
//   structure: SalaryStructureCalc,
//   fromDate: string
// ) => {
//   const monthIndex = getMonthIndex(fromDate);

//   return calculateDeductionAmounts(structure).map((d) => ({
//     ...d,
//     ytd: d.amount * monthIndex,
//   }));
// };


// export const calculateTotalEarningsYTD = (
//   structure: SalaryStructureCalc,
//   fromDate: string
// ): number => {
//   return calculateEarningsWithYTD(structure, fromDate).reduce(
//     (sum, e) => sum + e.ytd,
//     0
//   );
// };


// export const calculateTotalDeductionsYTD = (
//   structure: SalaryStructureCalc,
//   fromDate: string
// ): number => {
//   if (!structure.deductionsEnabled) return 0;

//   return calculateDeductionsWithYTD(structure, fromDate).reduce(
//     (sum, d) => sum + d.ytd,
//     0
//   );
// };

export const getFinancialYearMonthIndex = (date: string): number => {
  const d = new Date(date);
  const month = d.getMonth() + 1; // Jan = 1

  // Financial Year starts April
  return month >= 4 ? month - 3 : month + 9;
};



export const calculateEarningsWithYTD = (
  structure: SalaryStructureCalc,
  fromDate: string
) => {
  const monthIndex = getFinancialYearMonthIndex(fromDate);

  return calculateEarnings(structure).map((e) => ({
    ...e,
    ytd: e.amount * monthIndex,
  }));
};


export const calculateDeductionsWithYTD = (
  structure: SalaryStructureCalc,
  fromDate: string
) => {
  const monthIndex = getFinancialYearMonthIndex(fromDate);

  return calculateDeductionAmounts(structure).map((d) => ({
    ...d,
    ytd: d.amount * monthIndex,
  }));
};





export const calculateTotalEarningsYTD = (
  structure: SalaryStructureCalc,
  fromDate: string
): number => {
  return calculateEarningsWithYTD(structure, fromDate).reduce(
    (sum, e) => sum + e.ytd,
    0
  );
};


export const calculateTotalDeductionsYTD = (
  structure: SalaryStructureCalc,
  fromDate: string
): number => {
  if (!structure.deductionsEnabled) return 0;

  return calculateDeductionsWithYTD(structure, fromDate).reduce(
    (sum, d) => sum + d.ytd,
    0
  );
};



export const numberToWords = (num: number): string => {
  if (!num || num === 0) return "Zero";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty",
    "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  const convertBelowThousand = (n: number): string => {
    let str = "";

    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }

    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }

    if (n > 0) {
      str += ones[n] + " ";
    }

    return str.trim();
  };

  let words = "";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore) words += convertBelowThousand(crore) + " Crore ";
  if (lakh) words += convertBelowThousand(lakh) + " Lakh ";
  if (thousand) words += convertBelowThousand(thousand) + " Thousand ";
  if (num) words += convertBelowThousand(num);

  return words.trim();
};
