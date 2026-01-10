export type ExpenseItem = {
  title: string;
  date: string;
  amount: number;
  billNo?: string;
  description?: string;
  file?: string;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "PAID";
};

export type ActivityLog = {
  action: string;
  date: string;
  note?: string;
};

export type Reimbursement = {
  id: string;
  requestId: string;

  employee: {
    name: string;
    department: string;
    role?: "EMPLOYEE" | "MANAGER" | "FINANCE";
  };

  category: string;
  policy: string;

  amount: number;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "PAID";

  submitted?: string;
  created: string;

  expenseItems: ExpenseItem[];
  activityLog: ActivityLog[];
};
