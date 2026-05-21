import { portalClient, portalApi } from "@/lib/portalAxios";
import { ReactNode } from "react";

export type DocumentSource = "all" | "client" | "internal";

export interface PortalDocument {
  title: ReactNode;
  id: string;
  category: string | null;
  documentType: string;
  fileName: string;
  fileUrl: string;
  version: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  projectId?: string | null;
  projectName?: string | null;
  projectCode?: string | null;
  uploadedByName: string | null;
  uploadedByPortal?: boolean;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  viewCount: number;
  downloadCount: number;
  lastEvent: "view" | "download" | null;
}

export interface PortalDocumentUploadInput {
  base64?: string;
  externalUrl?: string;
  fileName?: string;
  category?: string;
  documentType?: string;
  projectId?: string | null;
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
  projects?: { id: string; name: string; code: string | null }[];
  sourceCounts?: {
    all: number;
    client: number;
    internal: number;
  };
}

export const portalDocumentService = {
  async list(
    params: {
      category?: string;
      search?: string;
      projectId?: string;
      source?: DocumentSource;
    } = {},
  ) {
    const qs = new URLSearchParams();
    if (params.category) qs.append("category", params.category);
    if (params.search) qs.append("search", params.search);
    if (params.projectId) qs.append("projectId", params.projectId);
    if (params.source && params.source !== "all") {
      qs.append("source", params.source);
    }
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

  async upload(input: PortalDocumentUploadInput): Promise<PortalDocument> {
    const doc = await portalClient.post(`/api/client-portal/documents`, input);
    if (doc.data?.success === false) {
      throw new Error(doc.data.error || "Failed to upload document");
    }
    return doc.data?.data as PortalDocument;
  },
};
