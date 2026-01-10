import { Reimbursement } from "@/types/reimbursement";

/* ===== INITIAL STATIC DATA (FIXED STATUS) ===== */
let reimbursements: Reimbursement[] = [
  {
    id: "1",
    requestId: "REQ-2025-001",
    employee: { name: "Current User", department: "Engineering" },
    category: "Travel",
    policy: "Travel Policy",
    amount: 12000,
    status: "PENDING_APPROVAL", 
    submitted: "10 Feb 2025",
    created: "09 Feb 2025",
    expenseItems: [],
    activityLog: [
      { action: "Created by Ramesh Kumar", date: "09 Feb 2025" },
    ],
  },
  {
    id: "2",
    requestId: "REQ-2025-002",
    employee: { name:"Current User", department: "HR" },
    category: "Medical",
    policy: "Medical Policy",
    amount: 4500,
    status: "APPROVED", 
    submitted: "08 Feb 2025",
    created: "07 Feb 2025",
    expenseItems: [],
    activityLog: [
      { action: "Approved by Manager", date: "08 Feb 2025" },
    ],
  },
  {
    id: "3",
    requestId: "REQ-2025-003",
    employee: { name:"Current User", department: "Finance" },
    category: "Food",
    policy: "Food Policy",
    amount: 2300,
    status: "REJECTED",
    submitted: "06 Feb 2025",
    created: "05 Feb 2025",
    expenseItems: [],
    activityLog: [
      { action: "Rejected by Manager", date: "06 Feb 2025" },
    ],
  },
  {
    id: "4",
    requestId: "REQ-2025-004",
    employee: { name: "Current User", department: "Operations" },
    category: "Internet",
    policy: "Internet Policy",
    amount: 1800,
    status: "PENDING_APPROVAL", // ✅
    submitted: "04 Feb 2025",
    created: "03 Feb 2025",
    expenseItems: [],
    activityLog: [
      { action: "Created by Anita Verma", date: "03 Feb 2025" },
    ],
  },
];

/* ===== SERVICE METHODS ===== */
export const ReimbursementService = {
  getAll: async () => {
    return reimbursements;
  },

  create: async (data: Reimbursement) => {
    reimbursements.unshift(data); // newest top
    return data;
  },

  updateStatus: async (id: string, status: Reimbursement["status"]) => {
    const item = reimbursements.find(r => r.id === id);
    if (item) item.status = status;
    return item;
  },
};
