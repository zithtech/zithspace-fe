export type Category = {
  id: string;
  key:string;
  name: string;
  maxPerRequest: number;
  monthlyLimit: number;
  yearlyLimit: number;
  eligibleRoles: string[];
  accept:string[];
  attachmentRequired: boolean;
  status: "Active" | "Inactive";
};
