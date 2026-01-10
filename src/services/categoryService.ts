import { Category } from "@/types/category";

let categories: Category[] = [
  {
    id: "1",
    key: "1", // 
    name: "Travel",
    maxPerRequest: 500,
    monthlyLimit: 2000,
    yearlyLimit: 10000,
    eligibleRoles: ["Employee", "Manager"],
    attachmentRequired: true,
    status: "Active",
    accept: ["Finance"],
  },
  {
    id: "2",
    key: "2", // ✅ ADD THIS
    name: "Food",
    maxPerRequest: 100,
    monthlyLimit: 500,
    yearlyLimit: 3000,
    eligibleRoles: ["Employee"],
    attachmentRequired: false,
    status: "Active",
    accept: ["Manager"],
  },
  {
    id: "3",
    key: "3", // ✅ ADD THIS
    name: "Internet",
    maxPerRequest: 75,
    monthlyLimit: 300,
    yearlyLimit: 2000,
    eligibleRoles: ["Employee"],
    attachmentRequired: true,
    status: "Active",
    accept: ["Finance"],
  },
  {
    id: "4",
    key: "4", // ✅ ADD THIS
    name: "Medical",
    maxPerRequest: 250,
    monthlyLimit: 1000,
    yearlyLimit: 5000,
    eligibleRoles: ["Employee"],
    attachmentRequired: true,
    status: "Active",
    accept: ["Manager"]
  },
];

export const CategoryService = {
  getAll: async () => categories.map(c => ({ ...c, key: c.id })), // ✅ Ensure key exists

  create: async (data: Category) => {
    const newCategory = { ...data, id: Date.now().toString(), key: Date.now().toString() };
    categories.unshift(newCategory);
    return newCategory;
  },

  updateStatus: async (id: string, status: Category["status"]) => {
    const item = categories.find(c => c.id === id);
    if (item) item.status = status;
    return item;
  },

  // ✅ ADD THESE METHODS
  update: async (id: string, data: Partial<Category>) => {
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...data, key: id };
      return categories[index];
    }
    return null;
  },

  delete: async (id: string) => {
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories.splice(index, 1);
      return true;
    }
    return false;
  }
};
