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
    async getThreads(label?: string) {
        return await api.get("/api/mail/threads", { params: { label } });
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

    async deleteThread(id: string) {
        return await api.delete(`/api/mail/threads/${id}`);
    },

    async restoreThread(threadId: string) {
        return await api.post(`/api/mail/threads/restore`, { threadId });
    },

    async deleteThreads(ids: string[]) {
        return await api.post("/api/mail/threads/bulk-delete", { ids });
    },

    async emptyTrash() {
        return await api.post("/api/mail/threads/empty-trash");
    },

    async getStatus(provider: MailProvider) {
        // Shared with calendar status usually, but we can have specific mail status if needed
        return await api.get(`/api/calendar/${provider}/status`);
    }
};
