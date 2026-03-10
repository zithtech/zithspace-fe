import { useState, useCallback, useEffect } from "react";
import { MailService, MailThread } from "@/services/mailService";

export const useMail = () => {
    const [threads, setThreads] = useState<MailThread[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
    const [isFetchingStatus, setIsFetchingStatus] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    const fetchMailStatus = useCallback(async () => {
        setIsFetchingStatus(true);
        try {
            const data = await MailService.getMailStatus();
            if (data?.connected && data?.email) {
                setConnectedEmail(data.email);
            } else {
                setConnectedEmail(null);
            }
        } catch (err: any) {
            console.error("[useMail] fetchMailStatus error:", err);
            // Don't set main error state here to avoid blocking UI if just status fails
        } finally {
            setIsFetchingStatus(false);
        }
    }, []);

    const fetchThreads = useCallback(async (label?: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await MailService.getThreads(label);
            console.log("[useMail] fetchThreads data received:", data);
            setThreads(data?.data || data || []);
        } catch (err: any) {
            console.error("[useMail] fetchThreads error:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }, []);

    const syncMail = useCallback(async (label?: string) => {
        setSyncing(true);
        try {
            await MailService.syncMail();
            await fetchThreads(label);
        } catch (err: any) {
            setError(err.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    }, [fetchThreads]);

    useEffect(() => {
        fetchMailStatus();
    }, [fetchMailStatus]);

    const deleteThread = useCallback(async (id: string) => {
        setLoading(true);
        try {
            await MailService.deleteThread(id);
            setThreads(prev => prev.filter(t => t.id !== id));
            return { success: true };
        } catch (err: any) {
            setError(err.message || "Deletion failed");
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const restoreThread = useCallback(async (id: string) => {
        setLoading(true);
        try {
            await MailService.restoreThread(id);
            setThreads(prev => prev.filter(t => t.id !== id));
            return { success: true };
        } catch (err: any) {
            setError(err.message || "Restoration failed");
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteThreads = useCallback(async (ids: string[]) => {
        setLoading(true);
        try {
            await MailService.deleteThreads(ids);
            setThreads(prev => prev.filter(t => !ids.includes(t.id)));
            return { success: true };
        } catch (err: any) {
            setError(err.message || "Bulk deletion failed");
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const emptyTrash = useCallback(async () => {
        setLoading(true);
        try {
            await MailService.emptyTrash();
            setThreads([]);
            return { success: true };
        } catch (err: any) {
            setError(err.message || "Emptying trash failed");
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const sendMessage = useCallback(async (mailData: any) => {
        setIsSending(true);
        try {
            await MailService.sendMessage(mailData);
            return { success: true };
        } catch (err: any) {
            setError(err.message || "Failed to send email");
            return { success: false, error: err.message };
        } finally {
            setIsSending(false);
        }
    }, []);

    const saveDraft = useCallback(async (mailData: any) => {
        setIsSavingDraft(true);
        try {
            const response = await MailService.saveDraft(mailData);
            return { success: true, data: response.data };
        } catch (err: any) {
            setError(err.message || "Failed to save draft");
            return { success: false, error: err.message };
        } finally {
            setIsSavingDraft(false);
        }
    }, []);

    const sendDraft = useCallback(async (draftId: string) => {
        setIsSending(true);
        try {
            await MailService.sendDraft(draftId);
            return { success: true };
        } catch (err: any) {
            setError(err.message || "Failed to send draft");
            return { success: false, error: err.message };
        } finally {
            setIsSending(false);
        }
    }, []);

    return {
        threads,
        loading,
        syncing,
        error,
        connectedEmail,
        isFetchingStatus,
        isSending,
        isSavingDraft,
        fetchThreads,
        fetchMailStatus,
        syncMail,
        sendMessage,
        saveDraft,
        sendDraft,
        deleteThread,
        deleteThreads,
        restoreThread,
        emptyTrash
    };
};
