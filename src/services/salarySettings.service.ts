import { SalaryStructure,Company,AttendanceResponse,ReimbursementResponse,Employee,EmployeeSalary } from "@/types/salary";

let structures: SalaryStructure[] = [];

export const SalaryStructureService = {
  getAll(): SalaryStructure[] {
    return [...structures];
  },

  create(structure: SalaryStructure) {
    if (structures.length === 0) {
      structure.isActive = true;
    }
    structures = [structure, ...structures];
  },

  setActive(id: number) {
    structures = structures.map((s) => ({
      ...s,
      isActive: s.id === id,
    }));
  },

  getById(id: number) {
    return structures.find((s) => s.id === id);
  },

  update(id: number, data: Partial<SalaryStructure>) {
    structures = structures.map((s) =>
      s.id === id ? { ...s, ...data } : s
    );
  },
};


let companies: Company[] = [];

export const CompanyService = {
  async getAll(): Promise<Company[]> {
    return [...companies];
  },

  async getById(id: number): Promise<Company | undefined> {
    return companies.find((c) => c.id === id);
  },

  async getActive(): Promise<Company | undefined> {
    return companies.find((c) => c.isActive);
  },

  async create(company: Company) {
    if (companies.length === 0) company.isActive = true;
    companies.unshift(company);
  },

  async update(id: number, company: Company) {
    companies = companies.map((c) => (c.id === id ? company : c));
  },

  async setActive(id: number) {
    companies = companies.map((c) => ({
      ...c,
      isActive: c.id === id,
    }));
  },
};



// OLD
// getAll() {
//   return structures;
// }

// NEW
// async getAll() {
//   const res = await axios.get("/api/salary-structures");
//   return res.data;
// }






// OLD
// getAll() {
//   return structures;
// }

// NEW
// async getAll() {
//   const res = await axios.get("/api/salary-structures");
//   return res.data;
// }

// export async function fetchAttendance(): Promise<AttendanceResponse> {
//   const res = await fetch("/api/attendance");

//   if (!res.ok) {
//     throw new Error("Failed to fetch attendance");
//   }

//   const json = await res.json();
//   return json.attendance;
// }

export async function fetchAttendance(): Promise<AttendanceResponse> {
  // 🔁 Later replace with real API
  // const res = await fetch("/api/attendance");
  // return (await res.json()).attendance;

  // ✅ Dynamic default (API maari behave pannum)
  return {
    calendarDays: 31,
    standardDays: 23,
    workedDays: 20,
    paidDays: 22,
    lopDays: 1,

    leaves: {
      cl: 1,
      sl: 1,
      pl: 0,
    },

    holidays: 4,
    weeklyOffs: 5,

    overtime: {
      hours: 6,
      unit: "hrs",
    },
  };
}

export async function fetchReimbursements(): Promise<ReimbursementResponse> {
  // 🔁 Replace with real API later
  return {
    reimbursements: {
      travel: { amount: 2500, ytd: 18000 },
      internet: { amount: 1000, ytd: 12000 },
      
     
      fuel: { amount: 3000, ytd: 24000 },
    },
    total: 6500,
    // totalYtd: 60000,
  };
}

// 🔴 REAL API (future)
export const fetchEmployees = async (): Promise<Employee[]> => {
  const res = await fetch("/api/employees");
  return res.json();
};

// services/salary.service.ts


export async function fetchEmployeeSalary(
  employeeId: string
): Promise<EmployeeSalary> {
  // 🔁 Later replace with real API
  // const res = await fetch(`/api/employees/${employeeId}/salary`);
  // return await res.json();

  // ✅ Mock data (API maari behave pannum)
  return {
    employeeId,
    grossSalary: 60000,
    deductionsEnabled: true,

    earnings: [
      { id: 1, name: "Basic", percentage: 50 },
      { id: 2, name: "HRA", percentage: 30 },
      { id: 3, name: "Special Allowance", percentage: 20 },
    ],

    deductions: [
      { id: 1, name: "PF", type: "BASIC_PERCENT", value: 12 },
      { id: 2, name: "ESI", type: "FIXED", value: 500 },
    ],
  };
}


// services/allowance.service.ts
export const fetchAllowances = async () => {
  // TEMP — replace with real API
  return [
    { id: 1, name: "House Rent Allowance", amount: 8000, ytd: 96000 },
    { id: 2, name: "Travel Allowance", amount: 3000, ytd: 36000 },
  ];
};

