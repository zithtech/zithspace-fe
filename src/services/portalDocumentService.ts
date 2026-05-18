import { portalClient, portalApi } from "@/lib/portalAxios";

export interface PortalDocument {
  id: string;
  category: string | null;
  documentType: string;
  fileName: string;
  fileUrl: string;
  version: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  uploadedByName: string | null;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  viewCount: number;
  downloadCount: number;
  lastEvent: "view" | "download" | null;
}

export interface PortalDocumentGroup {
  category: string;
  count: number;
  items: PortalDocument[];
}

export interface PortalDocumentMeta {
  total: number;
  groups: PortalDocumentGroup[];
  categories: string[];
}

export const portalDocumentService = {
  async list(params: { category?: string; search?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.category) qs.append("category", params.category);
    if (params.search) qs.append("search", params.search);
    const res = await portalClient.get(
      `/api/client-portal/documents${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.error || "Failed to load documents");
    }
    return {
      data: (res.data?.data || []) as PortalDocument[],
      meta: (res.data?.meta || null) as PortalDocumentMeta | null,
    };
  },

  // Fire-and-forget — returns 204
  track(id: string, event: "view" | "download") {
    return portalApi
      .post(`/api/client-portal/documents/${id}/track`, { event })
      .catch(() => undefined);
  },
};
