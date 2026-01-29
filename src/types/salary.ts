// export type Earning = {
//   id: number;
//   name: string;
//   percentage: number;
//   description?: string;
// };

// export type Deduction = {
//   id: number;
//   name: string;
//   type:string;
//   value: number;
// };

export type DeductionType =
  | "BASIC_PERCENT"
  | "GROSS_PERCENT"
  | "FIXED";

export type Earning = {
  id: number;
  name: string;
  percentage: number;
  description?: string;
};

export type Deduction = {
  id: number;
  name: string;
  type: DeductionType;
  value: number;
};


export interface SalaryStructure {
  id: number;
  name: string;
  description: string;
  grossSalary: number;
  earnings: Earning[];
  deductions: Deduction[];
  deductionsEnabled: boolean; 
  createdAt: string;
  isActive: boolean;
}


// export interface Company {
//   id: number;
//   name: string;
//   email: string;
//   phone: string;

//   plotNo: string;
//   floorNo: string;
//   buildingName: string;
//   street: string;
//   area: string;
//   city: string;
//   pincode: string;
//   country: string;

//   cin: string;
//   gst: string;
//   isActive: boolean;
//   logo?: string; // ✅ ADD THIS
// }


export interface Company {
  id: number;
  name: string;

  email?: string;
  phone?: string;

  plotNo?: string;
  floorNo?: string;
  buildingName?: string;
  street?: string;
  area?: string;
  city?: string;
  pincode?: string;
  country?: string;

  cin?: string;
  gst?: string;

  isActive: boolean;
  logo?: string;
}


export type PreviewType =
  | "company"
  | "payslip"
  | "employee"
  | "salary"
  | null;


export interface AttendanceResponse {
  calendarDays: number;
  standardDays: number;
  workedDays: number;
  paidDays: number;
  lopDays: number;

  leaves: Record<string, number>;

  holidays: number;
  weeklyOffs: number;

  overtime?: {
    hours: number;
    unit: string;
  };
}

export const ATTENDANCE_LABELS: Record<string, string> = {
  calendarDays: "Calendar Days",
  standardDays: "Standard Days",
  workedDays: "Worked Days",
  paidDays: "Paid Days",
  // lopDays: "LOP Days",
};

export const LEAVE_LABELS: Record<string, string> = {
  cl: "Casual Leave",
  sl: "Sick Leave",
  pl: "Privilege Leave",
};


export interface ReimbursementItem {
  amount: number;
  ytd: number;
}

export interface ReimbursementResponse {
  reimbursements: Record<string, ReimbursementItem>;
  total: number;
  // totalYtd: number;
}


export const REIMBURSEMENT_LABELS: Record<string, string> = {
  travel: "Travel",
  internet: "Internet",
  mobile: "Mobile",
  fuel: "Fuel",
};


export interface Employee {
  employeeName: string;
  employeeId: string;
  department: string;
  designation: string;
  doj: string;
  grade: string;
  pan: string;
  location: string;
  uanNo: string;
  pfNo: string;
  esiNo: string;
  bankName: string;
  accountNo: string;
}



// mock/employees.mock.ts
// ❌ Remove when real API is ready
export const mockEmployees: Employee[] = [
  {
    employeeName: "Michael Johnson",
    employeeId: "EMP001",
    department: "Finance",
    designation: "Senior Accountant",
    doj: "2021-04-12",
    grade: "G5",
    pan: "ABCDE1234F",
    location: "Chennai",
    uanNo: "100200300401",
    pfNo: "TN/CH/123456/0001",
    esiNo: "560012345600001",
    bankName: "HDFC Bank",
    accountNo: "50200012345678",
  },
  {
    employeeName: "Jane Smith",
    employeeId: "EMP002",
    department: "HR",
    designation: "HR Manager",
    doj: "2020-08-01",
    grade: "G6",
    pan: "PQRSX5678L",
    location: "Bangalore",
    uanNo: "100200300402",
    pfNo: "KA/BLR/223344/0002",
    esiNo: "560012345600002",
    bankName: "ICICI Bank",
    accountNo: "455001234567",
  },
  {
    employeeName: "John Doe",
    employeeId: "EMP003",
    department: "Engineering",
    designation: "Software Engineer",
    doj: "2022-01-15",
    grade: "G4",
    pan: "LMNOP9876Q",
    location: "Hyderabad",
    uanNo: "100200300403",
    pfNo: "TS/HYD/998877/0003",
    esiNo: "560012345600003",
    bankName: "Axis Bank",
    accountNo: "912345678901",
  },
  {
    employeeName: "Vinodhini purushothaman nagarani",
    employeeId: "EMP004",
    department: "Engineering",
    designation: "Frontend Developer",
    doj: "2023-06-10",
    grade: "G3",
    pan: "VINOP4321K",
    location: "Coimbatore",
    uanNo: "100200300404",
    pfNo: "TN/CBE/445566/0004",
    esiNo: "560012345600004",
    bankName: "SBI",
    accountNo: "20012345678",
  },
  {
    employeeName: "Subha",
    employeeId: "EMP005",
    department: "HR",
    designation: "HR Executive",
    doj: "2022-09-20",
    grade: "G3",
    pan: "SUBHA6789M",
    location: "Madurai",
    uanNo: "100200300405",
    pfNo: "TN/MDU/112233/0005",
    esiNo: "560012345600005",
    bankName: "Canara Bank",
    accountNo: "345678901234",
  },
  {
    employeeName: "Abinash",
    employeeId: "EMP006",
    department: "Engineering",
    designation: "Backend Developer",
    doj: "2021-11-05",
    grade: "G4",
    pan: "ABINA1234Z",
    location: "Trichy",
    uanNo: "100200300406",
    pfNo: "TN/TRY/667788/0006",
    esiNo: "560012345600006",
    bankName: "Union Bank",
    accountNo: "789012345678",
  },
];



 export interface EmployeeSalary {
  employeeId: string;
  grossSalary: number;
  deductionsEnabled: boolean;
  earnings: Earning[];
  deductions: Deduction[];
}
