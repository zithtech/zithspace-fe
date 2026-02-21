"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    ZohoCalendarService,
    ZohoEvent,
    ZohoStatus,
    CreateEventData,
    UpdateEventData,
    EventFilters,
} from "@/services/zohoCalendarService";

interface UseZohoCalendarReturn {
    // State
    status: ZohoStatus | null;
    events: ZohoEvent[];
    loading: boolean;
    isConnecting: boolean;
    isDisconnecting: boolean;
    syncing: boolean;
    error: string | null;
    successMessage: string | null;

    // Actions
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    fetchEvents: (filters?: EventFilters) => Promise<void>;
    createEvent: (data: CreateEventData) => Promise<ZohoEvent | null>;
    updateEvent: (id: string, data: UpdateEventData) => Promise<ZohoEvent | null>;
    deleteEvent: (id: string, action?: number, occurrenceDate?: string, refreshRange?: { start: string, end: string }) => Promise<boolean>;
    syncEvents: () => Promise<void>;
    clearMessages: () => void;
}

export function useZohoCalendar(): UseZohoCalendarReturn {
    const [status, setStatus] = useState<ZohoStatus | null>(null);
    const [events, setEvents] = useState<ZohoEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    const clearMessages = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    // Fetch connection status on mount
    const fetchStatus = useCallback(async () => {
        try {
            const s = await ZohoCalendarService.getStatus();
            setStatus(s);
            return s;
        } catch (err: any) {
            console.error("Failed to fetch Zoho status:", err);
            return null;
        }
    }, []);

    useEffect(() => {
        fetchStatus().then((s) => {
            // If connected, auto-load events for current month
            if (s?.connected) {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                fetchEvents({
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle OAuth callback query params
    useEffect(() => {
        const connected = searchParams.get("connected");
        const oauthError = searchParams.get("error");

        if (connected === "true") {
            setSuccessMessage("Zoho Calendar connected successfully!");
            fetchStatus().then((s) => {
                if (s?.connected) {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    fetchEvents({
                        startDate: start.toISOString(),
                        endDate: end.toISOString(),
                    });
                }
            });
            // Clean URL
            router.replace("/calendar");
        }

        if (oauthError) {
            const messages: Record<string, string> = {
                zoho_denied: "Zoho authorization was denied.",
                missing_params: "OAuth callback missing required parameters.",
                token_exchange_failed: "Failed to exchange authorization code for tokens.",
                callback_failed: "OAuth callback failed. Please try again.",
            };
            setError(messages[oauthError] || "Failed to connect Zoho Calendar.");
            router.replace("/calendar");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const connect = useCallback(async () => {
        try {
            setIsConnecting(true);
            setError(null);
            const authUrl = await ZohoCalendarService.getConnectUrl();
            window.location.href = authUrl;
        } catch (err: any) {
            setError(err.message || "Failed to initiate Zoho connection");
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        try {
            setIsDisconnecting(true);
            setError(null);
            await ZohoCalendarService.disconnect();
            setStatus({ connected: false, calendarId: null, tokenExpiry: null, lastSync: null });
            setEvents([]);
            setSuccessMessage("Zoho Calendar disconnected.");
        } catch (err: any) {
            setError(err.message || "Failed to disconnect Zoho account");
        } finally {
            setIsDisconnecting(false);
        }
    }, []);

    const fetchEvents = useCallback(async (filters: EventFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const data = await ZohoCalendarService.getEvents(filters);
            setEvents(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch events");
        } finally {
            setLoading(false);
        }
    }, []);

    const createEvent = useCallback(async (data: CreateEventData): Promise<ZohoEvent | null> => {
        try {
            setLoading(true);
            setError(null);
            const event = await ZohoCalendarService.createEvent(data);
            setEvents((prev) => [...prev, event].sort(
                (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            ));
            setSuccessMessage("Event created successfully!");
            return event;
        } catch (err: any) {
            setError(err.message || "Failed to create event");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateEvent = useCallback(async (id: string, data: UpdateEventData): Promise<ZohoEvent | null> => {
        try {
            setLoading(true);
            setError(null);
            const updated = await ZohoCalendarService.updateEvent(id, data);
            setEvents((prev) =>
                prev.map((e) => (e.id === id ? updated : e)).sort(
                    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                )
            );
            setSuccessMessage("Event updated successfully!");
            return updated;
        } catch (err: any) {
            setError(err.message || "Failed to update event");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteEvent = useCallback(async (id: string, action?: number, occurrenceDate?: string, refreshRange?: { start: string, end: string }): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);
            await ZohoCalendarService.deleteEvent(id, action, occurrenceDate);

            if (action === 2 || action === undefined) {
                setEvents((prev) => prev.filter((e) => e.id !== id));
            } else {
                // Partial delete (one day): re-fetch to get updated exdate/exclusions
                // Backend now manually updates DB for immediate visibility, but we wait a tiny bit for safety
                await new Promise(resolve => setTimeout(resolve, 500));

                // Use the provided refreshRange or default to current month
                const start = refreshRange?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
                const end = refreshRange?.end || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();

                const data = await ZohoCalendarService.getEvents({
                    startDate: start,
                    endDate: end,
                });
                setEvents(data);
            }
            setSuccessMessage("Event deleted successfully!");
            return true;
        } catch (err: any) {
            setError(err.message || "Failed to delete event");
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const syncEvents = useCallback(async () => {
        try {
            setSyncing(true);
            setError(null);
            const result = await ZohoCalendarService.syncEvents();
            setSuccessMessage(`Synced ${result.synced} events from Zoho Calendar.`);
            // Re-fetch events after sync
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const data = await ZohoCalendarService.getEvents({
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            });
            setEvents(data);
            // Refresh connection status to get the updated lastSync timestamp
            await fetchStatus();
        } catch (err: any) {
            setError(err.message || "Failed to sync events");
        } finally {
            setSyncing(false);
        }
    }, []);

    return {
        status,
        events,
        loading,
        isConnecting,
        isDisconnecting,
        syncing,
        error,
        successMessage,
        connect,
        disconnect,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        syncEvents,
        clearMessages,
    };
}
