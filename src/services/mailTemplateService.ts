import { api } from "@/lib/axios";

/** One placeholder chip in the editor's side panel. */
export interface PlaceholderField {
    field: string;
    label: string;
    hint: string;
}

/**
 * Placeholders arrive grouped by who they describe — Client Contacts and
 * Members draw from different records, so they are chosen from different
 * sections rather than one flat list.
 */
export interface PlaceholderGroup {
    /** "sender" is you, the signed-in member — the group a signature uses. */
    key: "client_contact" | "member" | "sender";
    label: string;
    description: string;
    fields: PlaceholderField[];
}

export interface MailTemplate {
    id: string;
    name: string;
    subject: string;
    /** Sanitised HTML, placeholders included. */
    body: string;
    category: string | null;
    isDefault: boolean;
    /** Tokens the template uses, derived server-side from the copy itself. */
    placeholders: string[];
    /** Tokens it uses that are not in the catalogue — they send literally. */
    unknownPlaceholders: string[];
    createdAt: string;
    updatedAt: string;
}

export interface TemplateRecipient {
    id: string;
    kind: "client_contact" | "member";
    name: string;
    email: string;
    subtitle: string | null;
    values: Record<string, string | null>;
}

export interface RenderedTemplate {
    subject: string;
    body: string;
    /** Tokens left standing: unknown, or empty for this recipient. */
    unresolved: string[];
    recipient: TemplateRecipient | null;
    /** The sender's signature, already resolved. Empty when they have none. */
    signature: string;
}

export interface MailSignature {
    /** As stored — placeholders still standing. */
    html: string;
    /** The same signature with your own details filled in. */
    resolvedHtml: string;
    /** True when nothing is saved yet and this was built from your record. */
    isAutofilled: boolean;
    updatedAt: string | null;
    sender: { id: string; name: string; email: string; values: Record<string, string | null> } | null;
}

/** A shelf in the library: a category name and how full it is. */
export interface TemplateCategory {
    /** null for the templates nobody has filed. */
    name: string | null;
    count: number;
}

/**
 * What to pass as a category to mean "the unfiled ones". A sidebar entry and a
 * query param cannot carry null, and "" is indistinguishable from no filter.
 */
export const UNCATEGORIZED = "__none__";

export interface MailTemplatePayload {
    name: string;
    subject: string;
    body: string;
    category?: string | null;
    isDefault?: boolean;
}

const BASE = "/api/mail/templates";

export const MailTemplateService = {
    async list(search?: string, category?: string) {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (category) params.append("category", category);
        const query = params.toString();
        return await api.get<MailTemplate[]>(`${BASE}${query ? `?${query}` : ""}`);
    },

    async getCategories() {
        return await api.get<TemplateCategory[]>(`${BASE}/categories`);
    },

    async get(id: string) {
        return await api.get<MailTemplate>(`${BASE}/${id}`);
    },

    async create(payload: MailTemplatePayload) {
        return await api.post<MailTemplate>(BASE, payload);
    },

    async update(id: string, payload: Partial<MailTemplatePayload>) {
        return await api.put<MailTemplate>(`${BASE}/${id}`, payload);
    },

    async remove(id: string) {
        return await api.delete<{ id: string }>(`${BASE}/${id}`);
    },

    async setDefault(id: string) {
        return await api.post<MailTemplate>(`${BASE}/${id}/default`);
    },

    /** The signed-in member's own signature — never anyone else's. */
    async getSignature() {
        return await api.get<MailSignature>(`${BASE}/signature`);
    },

    async saveSignature(html: string) {
        return await api.put<MailSignature>(`${BASE}/signature`, { html });
    },

    /** Discard the saved signature; the autofilled one comes back. */
    async resetSignature() {
        return await api.delete<MailSignature>(`${BASE}/signature`);
    },

    async getPlaceholders() {
        return await api.get<{ groups: PlaceholderGroup[] }>(`${BASE}/placeholders`);
    },

    async getRecipients(search?: string) {
        const query = search ? `?search=${encodeURIComponent(search)}` : "";
        return await api.get<TemplateRecipient[]>(`${BASE}/recipients${query}`);
    },

    /**
     * Fill a template in for one recipient. Pass the address Compose already
     * holds, or an explicit recipient from the picker.
     */
    async render(
        id: string,
        target: { email?: string; recipientId?: string; recipientKind?: "client_contact" | "member" }
    ) {
        return await api.post<RenderedTemplate>(`${BASE}/${id}/render`, target);
    },
};
