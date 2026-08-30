import { api } from "@/lib/axios";

export type MailProvider = "GOOGLE" | "ZOHO" | "MICROSOFT";

export interface MailThread {
    id: string;
    subject: string;
    lastMessageAt: string;
    messageCount: number;
    snippet?: string;
    fromAddress?: string;
    toEmails?: string[];
    isRead?: boolean;
}

export interface MailMessage {
    id: string;
    threadId: string;
    subject: string;
    fromEmail: string;
    toEmails: string[];
    bodyText?: string;
    bodyHtml?: string;
    receivedAt: string;
    hasAttachments: boolean;
    attachments?: MailAttachment[];
}

export interface MailAttachment {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    downloadUrl: string;
}

export const MailService = {
    async getThreads(label?: string, filter?: string, search?: string, to?: string, from?: string) {
        let params = new URLSearchParams();
        if (label) params.append("label", label);
        if (filter) params.append("filter", filter);
        if (search) params.append("search", search);
        if (to) params.append("to", to);
        if (from) params.append("from", from);
        return await api.get(`/api/mail/threads?${params.toString()}`);
    },

    async getThreadMessages(threadId: string) {
        return await api.get(`/api/mail/threads/${threadId}/messages`);
    },

    async syncMail() {
        return await api.post("/api/mail/sync");
    },

    async sendMessage(mailData: { to: string | string[], subject: string, body: string, cc?: string[], bcc?: string[] }) {
        return await api.post("/api/mail/send", mailData);
    },

    async saveDraft(mailData: { to: string | string[], subject: string, body: string, cc?: string[], bcc?: string[], id?: string }) {
        return await api.post("/api/mail/drafts", mailData);
    },

    async sendDraft(draftId: string) {
        return await api.post("/api/mail/drafts/send", { draftId });
    },

    async getMailStatus() {
        return await api.get("/api/mail/status");
    },

    async getContacts() {
        return await api.get("/api/mail/contacts");
    },
    async getUnreadCount() {
        const response = await api.get("/api/mail/unread-count");
        return response?.data || response || { unreadCount: 0 };
    },
    async deleteThread(id: string) {
        return await api.delete(`/api/mail/threads/${id}`);
    },

    async restoreThread(threadId: string) {
        return await api.post(`/api/mail/threads/restore`, { threadId });
    },

    async deleteThreads(ids: string[]) {
        return await api.post("/api/mail/threads/bulk-delete", { ids });
    },
    async bulkRestoreThreads(ids: string[]) {
        return await api.post("/api/mail/threads/bulk-restore", { ids });
    },
    async bulkDestroyThreads(ids: string[]) {
        return await api.post("/api/mail/threads/bulk-destroy", { ids });
    },
    async emptyTrash() {
        return await api.post("/api/mail/threads/empty-trash");
    },
    async archiveThread(threadId: string) {
        return await api.post("/api/mail/threads/archive", { threadId });
    },
    async bulkArchiveThreads(ids: string[]) {
        return await api.post("/api/mail/threads/bulk-archive", { ids });
    },
    async markAsRead(threadId: string) {
        return await api.post("/api/mail/threads/mark-as-read", { threadId });
    },

    async uploadAttachment(file: string | ArrayBuffer | null, fileName: string) {
        return await api.post("/api/mail/upload-attachment", { file, fileName });
    },

    async enhanceMailContent(payload: { subject?: string; body: string; context?: string }) {
        return await api.post("/api/mail/ai/enhance", payload);
    },

    async correctMailGrammar(payload: { body: string }) {
        return await api.post("/api/mail/ai/grammar", payload);
    },

    async getStatus(provider: MailProvider) {
        // Shared with calendar status usually, but we can have specific mail status if needed
        return await api.get(`/api/calendar/${provider}/status`);
    },

    // Invoice Mail Settings (New)
    async getInvoiceMailSettings() {
        return await api.get("/api/mail/invoice-settings");
    },

    async setInvoiceMail(data: { email: string, provider: string, integrationId: string }) {
        return await api.post("/api/mail/invoice-mail", data);
    },

    async verifyInvoiceMail(token: string) {
        return await api.post("/api/mail/verify", { token });
    },

    async resendInvoiceMailVerification(email: string) {
        return await api.post("/api/mail/resend-verification", { email });
    },
    
    async disconnect(provider: string) {
        return await api.post(`/api/mail/${provider}/disconnect`);
    }
};
