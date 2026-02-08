import * as XLSX from "xlsx";
import { Employee } from "@/types/salary";
import { calculateNetPay } from "@/utils/salaryCalculator";

export const exportPayslipExcel = (
  employees: Employee[],
  fromDate: string,
  toDate: string,
  salaryStructures: Record<string, any>, // employeeId -> salaryStructure
) => {
  const rows = employees.map((emp, index) => {
    const structure = salaryStructures[emp.employeeId];
    const netPay = structure ? calculateNetPay(structure) : 0;

    return {
      "S.No": index + 1,

     
      "Employee Name": emp.employeeName,
      "Employee ID": emp.employeeId,
      Department: emp.department,
      Designation: emp.designation,
      DOJ: emp.doj,
      Grade: emp.grade,
      Location: emp.location,

    
      Period: `${fromDate} to ${toDate}`,

    
      PAN: emp.pan,
      "PF No": emp.pfNo,
      "ESI No": emp.esiNo,

     
      "Bank Name": emp.bankName,
      "Account No": emp.accountNo,

     
      "Net Transfer (₹)": netPay,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Payslip Summary");

  XLSX.writeFile(
    workbook,
    `Payslip_Summary_${fromDate}_to_${toDate}.xlsx`
  );
};