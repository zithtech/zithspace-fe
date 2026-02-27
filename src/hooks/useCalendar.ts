"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    CalendarService,
    CalendarEvent,
    CalendarStatus,
    CreateEventData,
    UpdateEventData,
    EventFilters,
    CalendarProvider
} from "@/services/calendarService";

interface UseCalendarReturn {
    // State
    events: CalendarEvent[];
    loading: boolean;
    syncing: boolean;
    error: string | null;
    successMessage: string | null;

    // Actions
    fetchEvents: (filters?: EventFilters) => Promise<void>;
    createEvent: (data: CreateEventData) => Promise<CalendarEvent | null>;
    updateEvent: (id: string, data: UpdateEventData) => Promise<CalendarEvent | null>;
    deleteEvent: (id: string, action?: number, occurrenceDate?: string) => Promise<boolean>;
    syncAll: () => Promise<void>;
    clearMessages: () => void;
}

export function useCalendar(): UseCalendarReturn {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    const clearMessages = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    // Initial load of events for current month
    useEffect(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        fetchEvents({
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle OAuth callback query params (for messages)
    useEffect(() => {
        const connected = searchParams.get("connected");
        const provider = searchParams.get("provider");
        const oauthError = searchParams.get("error");

        if (connected === "true") {
            setSuccessMessage(`${provider} Calendar connected successfully!`);
            // Refresh events
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            fetchEvents({
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            });
            // Clean URL
            router.replace("/calendar");
        }

        if (oauthError) {
            setError(`Failed to connect calendar: ${oauthError}`);
            router.replace("/calendar");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const fetchEvents = useCallback(async (filters: EventFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const data = await CalendarService.getEvents(filters);
            setEvents(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch events");
        } finally {
            setLoading(false);
        }
    }, []);

    const createEvent = useCallback(async (data: CreateEventData): Promise<CalendarEvent | null> => {
        try {
            setLoading(true);
            setError(null);
            const event = await CalendarService.createEvent(data);
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

    const updateEvent = useCallback(async (id: string, data: UpdateEventData): Promise<CalendarEvent | null> => {
        try {
            setLoading(true);
            setError(null);
            const updated = await CalendarService.updateEvent(id, data);
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

    const deleteEvent = useCallback(async (id: string, action?: number, occurrenceDate?: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);
            await CalendarService.deleteEvent(id, action, occurrenceDate);

            if (action === 0) {
                // Partial delete: re-fetch to get updated events
                await fetchEvents();
            } else {
                setEvents((prev) => prev.filter((e) => e.id !== id));
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

    const syncAll = useCallback(async () => {
        try {
            setSyncing(true);
            setError(null);
            await CalendarService.syncAll();
            setSuccessMessage("All calendars synced successfully.");
            // Re-fetch events after sync
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            await fetchEvents({
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            });
        } catch (err: any) {
            setError(err.message || "Failed to sync events");
        } finally {
            setSyncing(false);
        }
    }, [fetchEvents]);

    return {
        events,
        loading,
        syncing,
        error,
        successMessage,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        syncAll,
        clearMessages,
    };
}
