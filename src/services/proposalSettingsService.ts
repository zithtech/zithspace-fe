import { api } from "@/lib/axios";

export interface ProposalSettings {
  default_theme: string;
}

class ProposalSettingsService {
  async getSettings(): Promise<ProposalSettings> {
    const response = await api.get("/api/proposal-settings");
    return response;
  }

  async updateSettings(defaultTheme: string): Promise<ProposalSettings> {
    const response = await api.put("/api/proposal-settings", { defaultTheme });
    return response;
  }
}

export default new ProposalSettingsService();
