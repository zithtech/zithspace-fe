import { api } from "@/lib/axios";

export interface MomListItem {
  id: string;
  momNumber: string;
  title: string;
  meetingDate: string;
  durationMinutes: number | null;
  status: "draft" | "published" | "archived";
  visibility: "internal" | "client";
  projectId: string | null;
  projectName: string | null;
  recordingUrl: string | null;
  createdAt: string;
  actionCount: number;
  openActionCount: number;
  attendeeCount: number;
  attachments: MomListAttachment[];
}

export interface MomListAttachment {
  id: string;
  kind: "file" | "link";
  fileName: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
}

export interface MomAttendee {
  id?: string;
  name: string;
  email?: string | null;
  role?: string | null;
  party?: "client" | "internal" | "external";
  staffUserId?: string | null;
  portalUserId?: string | null;
  position?: number;
}
export interface MomDecision {
  id?: string;
  decision: string;
  decidedBy?: string | null;
  position?: number;
  createdAt?: string;
}
export interface MomActionItem {
  id?: string;
  text: string;
  ownerName?: string | null;
  ownerStaffUserId?: string | null;
  ownerPortalUserId?: string | null;
  dueDate?: string | null;
  status?: "open" | "in_progress" | "done" | "cancelled" | "converted";
  position?: number;
  convertedToType?: "portal_ticket" | "ticket" | "change_request" | null;
  convertedToId?: string | null;
  convertedAt?: string | null;
  convertedTicketNumber?: string | null;
  convertedTicketSubject?: string | null;
  convertedTicketStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Attachment row shape returned by the detail endpoint. Either a stored file
 * (kind='file') with R2-hosted URL + metadata, or an external link
 * (kind='link') the staff user pasted in.
 */
export interface MomAttachment {
  id?: string;
  kind: "file" | "link";
  fileName?: string | null;
  fileUrl?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  position?: number;
  createdAt?: string;
}

/**
 * Shape used when CREATING or UPDATING attachments via the payload — file
 * uploads carry a base64 data URL, links carry the URL + optional label.
 * Existing rows being preserved across an update just need `id`.
 */
export interface MomAttachmentInput {
  id?: string;
  kind: "file" | "link";
  fileDataUrl?: string;
  fileName?: string;
  linkUrl?: string;
  linkLabel?: string;
}

export interface MomDetail {
  id: string;
  momNumber: string;
  title: string;
  clientId: string;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  meetingDate: string;
  durationMinutes: number | null;
  location: string | null;
  recordingUrl: string | null;
  summary: string | null;
  aiSummary: string | null;
  visibility: "client" | "internal";
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  createdByName: string | null;
  attendees: MomAttendee[];
  decisions: MomDecision[];
  actionItems: MomActionItem[];
  attachments: MomAttachment[];
}

export interface MomCreatePayload {
  title: string;
  meetingDate: string;
  projectId?: string | null;
  durationMinutes?: number | null;
  location?: string | null;
  recordingUrl?: string | null;
  summary?: string | null;
  aiSummary?: string | null;
  visibility?: "client" | "internal";
  status?: "draft" | "published" | "archived";
  attendees?: MomAttendee[];
  decisions?: MomDecision[];
  actionItems?: MomActionItem[];
  attachments?: MomAttachmentInput[];
}

export const momService = {
  listForClient(clientId: string) {
    return api.get<MomListItem[]>(`/api/clients-v2/${clientId}/moms`);
  },
  create(clientId: string, payload: MomCreatePayload) {
    return api.post<MomDetail>(`/api/clients-v2/${clientId}/moms`, payload);
  },
  detail(id: string) {
    return api.get<MomDetail>(`/api/moms/${id}`);
  },
  update(id: string, payload: Partial<MomCreatePayload>) {
    return api.put<MomDetail>(`/api/moms/${id}`, payload);
  },
  remove(id: string) {
    return api.delete<void>(`/api/moms/${id}`);
  },
  updateActionItemStatus(
    itemId: string,
    status: "open" | "in_progress" | "done" | "cancelled",
  ) {
    return api.patch<{ id: string; status: string }>(
      `/api/moms/action-items/${itemId}/status`,
      { status },
    );
  },
  convertActionItem(
    itemId: string,
    payload: {
      target: "portal_ticket";
      category?: string;
      priority?: string;
    },
  ) {
    return api.post<{
      actionItemId: string;
      ticketId: string;
      ticketNumber: string;
      target: string;
    }>(`/api/moms/action-items/${itemId}/convert`, payload);
  },
};
