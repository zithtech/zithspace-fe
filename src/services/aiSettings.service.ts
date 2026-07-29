import { apiClient } from "@/lib/axios";

export type AiMode = "platform" | "byo";
export type AiProviderKind = "gemini" | "openai_compatible" | "anthropic";

export interface AiSettings {
  mode: AiMode;
  provider: string | null;
  model: string | null;
  baseUrl: string | null;
  isActive: boolean;
  hasApiKey: boolean;
  apiKeyMasked: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
}

export interface PlatformCatalogEntry {
  key: string;
  label: string;
  provider: string;
}

export interface AiSettingsResponse {
  settings: AiSettings | null;
  platformCatalog: PlatformCatalogEntry[];
}

export interface UpdateAiSettingsPayload {
  mode: AiMode;
  /** platform mode: catalog key */
  modelKey?: string;
  /** byo mode */
  provider?: AiProviderKind;
  model?: string;
  /** omit to keep the existing saved key */
  apiKey?: string;
  baseUrl?: string;
  isActive?: boolean;
}

export interface TestConnectionPayload {
  provider: AiProviderKind;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export const AiSettingsService = {
  async getSettings(): Promise<AiSettingsResponse> {
    const res = await apiClient.get("/api/ai/settings");
    return {
      settings: res.data?.settings ?? null,
      platformCatalog: res.data?.platformCatalog ?? [],
    };
  },

  async updateSettings(payload: UpdateAiSettingsPayload): Promise<AiSettings> {
    const res = await apiClient.put("/api/ai/settings", payload);
    return res.data?.settings;
  },

  /** Validate a credential and return the models it can access. */
  async testConnection(payload: TestConnectionPayload): Promise<string[]> {
    const res = await apiClient.post("/api/ai/settings/test", payload);
    return res.data?.models ?? [];
  },
};
