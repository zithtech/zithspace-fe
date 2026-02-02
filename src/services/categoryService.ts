import { Category } from "@/types/category";
import { mapCategoryFromApi } from "@/utils/categoryMapper";

const API_URL = "http://localhost:5000/api/reimbursementCategory";

/**
 * 🔐 Common headers
 * ❗ IMPORTANT:
 * - Inga NEVER error throw panna koodaadhu
 * - Token / tenant illa na backend handle pannum
 */
const headers = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "x-tenant-id": "PASTE_REAL_TENANT_UUID_HERE", 
  };
};


export const CategoryService = {
  // =========================
  // GET ALL CATEGORIES
  // =========================
  getAll: async (): Promise<Category[]> => {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: headers(),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch categories");
    }

    const json = await res.json();
    return json.data.map(mapCategoryFromApi);
  },

  // =========================
  // GET CATEGORY BY ID
  // =========================
  getById: async (id: string): Promise<Category> => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: headers(),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Category not found");
    }

    const json = await res.json();
    return mapCategoryFromApi(json.data);
  },

  // =========================
  // CREATE CATEGORY
  // =========================
  create: async (data: Category) => {
    const payload = {
      code: data.name.toUpperCase(), // backend expects
      name: data.name,
      description: data.name,

      maxRequestsPerMonth: data.maxPerRequest,
      monthlyLimitAmount: data.monthlyLimit,
      yearlyLimitAmount: data.yearlyLimit,

      allowedRoles: data.eligibleRoles,
      approvalFlow: data.accept,

      attachmentRequired: data.attachmentRequired,
      isActive: data.status === "Active",
    };

    console.log("CREATE CATEGORY PAYLOAD:", payload);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Create category failed");
    }

    return res.json();
  },

  // =========================
  // UPDATE CATEGORY
  // =========================
  update: async (id: string, data: Partial<Category>) => {
    const payload = {
      name: data.name,
      maxRequestsPerMonth: data.maxPerRequest,
      monthlyLimitAmount: data.monthlyLimit,
      yearlyLimitAmount: data.yearlyLimit,
      allowedRoles: data.eligibleRoles,
      approvalFlow: data.accept,
      attachmentRequired: data.attachmentRequired,
      isActive: data.status === "Active",
    };

    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Update category failed");
    }

    return res.json();
  },

  // =========================
  // DELETE CATEGORY (SOFT DELETE)
  // =========================
  delete: async (id: string) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: headers(),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Delete category failed");
    }

    return res.json();
  },
};
