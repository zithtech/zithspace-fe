import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MailService, MailThread, MailMessage } from "@/services/mailService";

// Query Keys
export const mailKeys = {
    all: ['mail'] as const,
    threads: (label?: string, filter?: string, search?: string, to?: string, from?: string) => [...mailKeys.all, 'threads', label, filter, search, to, from] as const,
    messages: (threadId: string) => [...mailKeys.all, 'messages', threadId] as const,
    status: () => [...mailKeys.all, 'status'] as const,
    unreadCount: () => [...mailKeys.all, 'unreadCount'] as const,
    contacts: () => [...mailKeys.all, 'contacts'] as const,
};

export const useMailThreads = (label?: string, filter?: string, search?: string, to?: string, from?: string) => {
    return useQuery({
        queryKey: mailKeys.threads(label, filter, search, to, from),
        queryFn: async () => {
            const response = await MailService.getThreads(label, filter, search, to, from);
            return response?.data || response || [];
        },
    });
};

export const useThreadMessages = (threadId: string | null) => {
    return useQuery({
        queryKey: mailKeys.messages(threadId || ''),
        queryFn: async () => {
            if (!threadId) return [];
            const response = await MailService.getThreadMessages(threadId);
            return response?.data || response || [];
        },
        enabled: !!threadId,
    });
};

export const useMailStatus = () => {
    return useQuery({
        queryKey: mailKeys.status(),
        queryFn: async () => {
            const data = await MailService.getMailStatus();
            return {
                connectedEmail: (data?.connected && data?.email) ? data.email : null,
                isConnected: !!data?.connected,
                provider: data?.provider || null
            };
        },
    });
};

export const useMailUnreadCount = () => {
    return useQuery({
        queryKey: mailKeys.unreadCount(),
        queryFn: async () => {
            const data = await MailService.getUnreadCount();
            return {
                unreadCount: data.unreadCount || 0,
                counts: data.counts || {}
            };
        },
    });
};

export const useMailContacts = () => {
    return useQuery({
        queryKey: mailKeys.contacts(),
        queryFn: async () => {
            const response = await MailService.getContacts();
            return response?.data || response || [];
        },
    });
};

export const useMail = () => {
    const queryClient = useQueryClient();

    const syncMailMutation = useMutation({
        mutationFn: () => MailService.syncMail(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail'] });
        },
    });

    const deleteThreadMutation = useMutation({
        mutationFn: (id: string) => MailService.deleteThread(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail'] });
        },
    });

    const restoreThreadMutation = useMutation({
        mutationFn: (threadId: string) => MailService.restoreThread(threadId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail'] });
        },
    });

    const deleteThreadsMutation = useMutation({
        mutationFn: (ids: string[]) => MailService.deleteThreads(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail'] });
        },
    });

    const bulkRestoreThreadsMutation = useMutation({
        mutationFn: (ids: string[]) => MailService.bulkRestoreThreads(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail'] });
        },
    });

    const emptyTrashMutation = useMutation({
        mutationFn: () => MailService.emptyTrash(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail'] });
        },
    });

    const archiveThreadMutation = useMutation({
        mutationFn: (id: string) => MailService.archiveThread(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail'] });
        },
    });

    const bulkArchiveThreadsMutation = useMutation({
        mutationFn: (ids: string[]) => MailService.bulkArchiveThreads(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail'] });
        },
    });

    const bulkDestroyThreadsMutation = useMutation({
        mutationFn: (ids: string[]) => MailService.bulkDestroyThreads(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail'] });
        },
    });

    const sendMessageMutation = useMutation({
        mutationFn: (mailData: any) => MailService.sendMessage(mailData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'threads'] });
        },
    });

    const saveDraftMutation = useMutation({
        mutationFn: (mailData: any) => MailService.saveDraft(mailData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'threads'] });
        },
    });

    const sendDraftMutation = useMutation({
        mutationFn: (draftId: string) => MailService.sendDraft(draftId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'threads'] });
        },
    });

    const uploadAttachmentMutation = useMutation({
        mutationFn: ({ file, fileName }: { file: string | ArrayBuffer | null, fileName: string }) =>
            MailService.uploadAttachment(file, fileName),
    });

    const markAsReadMutation = useMutation({
        mutationFn: (threadId: string) => MailService.markAsRead(threadId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mail', 'threads'] });
            queryClient.invalidateQueries({ queryKey: mailKeys.unreadCount() });
        },
    });

    return {
        syncMail: syncMailMutation.mutateAsync,
        isSyncing: syncMailMutation.isPending,

        sendMessage: sendMessageMutation.mutateAsync,
        isSending: sendMessageMutation.isPending,

        saveDraft: saveDraftMutation.mutateAsync,
        isSavingDraft: saveDraftMutation.isPending,

        sendDraft: sendDraftMutation.mutateAsync,

        markAsRead: markAsReadMutation.mutateAsync,

        uploadAttachment: uploadAttachmentMutation.mutateAsync,
        isUploading: uploadAttachmentMutation.isPending,

        deleteThread: deleteThreadMutation.mutateAsync,
        deleteThreads: deleteThreadsMutation.mutateAsync,
        isDeletingThreads: deleteThreadsMutation.isPending,

        restoreThread: restoreThreadMutation.mutateAsync,
        bulkRestoreThreads: bulkRestoreThreadsMutation.mutateAsync,
        isRestoringThreads: bulkRestoreThreadsMutation.isPending,

        archiveThread: archiveThreadMutation.mutateAsync,
        bulkArchiveThreads: bulkArchiveThreadsMutation.mutateAsync,
        isArchivingThreads: bulkArchiveThreadsMutation.isPending,

        bulkDestroyThreads: bulkDestroyThreadsMutation.mutateAsync,
        isDestroyingThreads: bulkDestroyThreadsMutation.isPending,

        emptyTrash: emptyTrashMutation.mutateAsync,
        isEmptyingTrash: emptyTrashMutation.isPending,

        isLoading: false,
    };
};
