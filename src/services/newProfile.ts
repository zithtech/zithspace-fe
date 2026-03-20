import { api } from "@/lib/axios"; // your axios instance

export interface ProfileResponse {
  success: boolean;
  data: any;
}

export const ProfileService = {
  getNewProfile: async (): Promise<any> => {
    try {
      const response = await api.get<ProfileResponse>("/profile/new");

      if (response.data && response.data.success) {
        return response.data.data;
      }

      throw new Error("Failed to fetch profile");
    } catch (error: any) {
      throw new Error(error.message || "Profile fetch failed");
    }
  },
};
