import { Category } from "@/types/category";

export const mapCategoryFromApi = (c: any): Category => ({
  id: c.id,
  key: c.id,
  name: c.name,

  maxPerRequest: c.maxRequestsPerMonth ?? 0,
  monthlyLimit: c.monthlyLimitAmount ?? 0,
  yearlyLimit: c.yearlyLimitAmount ?? 0,

  eligibleRoles: c.allowedRoles ?? [],
  accept: c.approvalFlow ?? [],

  attachmentRequired: c.attachmentRequired ?? false,
  status: c.isActive ? "Active" : "Inactive",
});
