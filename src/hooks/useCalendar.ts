"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    syncAll: (provider?: CalendarProvider) => Promise<void>;
    clearMessages: () => void;
}

export function useCalendar(): UseCalendarReturn {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [lastFilters, setLastFilters] = useState<EventFilters>({});
    const lastFiltersRef = useRef<EventFilters>(lastFilters);

    // Keep ref in sync with state for use in callbacks/setTimeouts
    useEffect(() => {
        lastFiltersRef.current = lastFilters;
    }, [lastFilters]);

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
            setLastFilters(filters); // Remember the last used filter
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
            const result = await CalendarService.createEvent(data);

            // Handle array (expanded series) or single object
            const newEvents = Array.isArray(result) ? result : [result];

            if (data.isRecurring && lastFiltersRef.current) {
                // Only fetch for complex recurring patterns, use local state for simple ones
                if (data.recurringDays && data.recurringDays.length > 2) {
                    await fetchEvents(lastFiltersRef.current);
                } else {
                    setEvents((prev) => [...prev, ...newEvents].sort(
                        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                    ));
                }
            } else {
                setEvents((prev) => [...prev, ...newEvents].sort(
                    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                ));
            }


            

            setSuccessMessage("Event created successfully!");
            return Array.isArray(result) ? result[0] : result;
        } catch (err: any) {
            setError(err.message || "Failed to create event");
            return null;
        } finally {
            setLoading(false);
        }
    }, [fetchEvents]);

const updateEvent = useCallback(async (id: string, data: UpdateEventData): Promise<CalendarEvent | null> => {
    try {
        setLoading(true);
        setError(null);
        console.log(`[useCalendar] updateEvent called with id: ${id}, data:`, data);
        const updated = await CalendarService.updateEvent(id, data);
        console.log(`[useCalendar] updateEvent response:`, updated);
        
        setSuccessMessage("Event updated successfully!");
        
        // Force refresh events to get latest data from backend
        // This ensures we have the latest event data after Zoho operations
        console.log(`[useCalendar] Forcing refresh after successful update`);
        
        // Add a small delay to ensure database update is fully committed
        setTimeout(async () => {
            // Add cache-busting timestamp to ensure fresh data
            const cacheBuster = Date.now();
            await fetchEvents({ cacheBuster });
        }, 500); // 500ms delay
        
        return updated;
    } catch (err: any) {
        setError(err.message || "Failed to update event");
        return null;
    } finally {
        setLoading(false);
    }
}, [fetchEvents]); // Add fetchEvents to dependencies

    const deleteEvent = useCallback(async (id: string, action?: number, occurrenceDate?: string): Promise<boolean> => {
        try {
            setLoading(true);
            setError(null);

            await CalendarService.deleteEvent(id, action, occurrenceDate);

            // Filter out events locally
            setEvents((prev) => {
                const eventToDelete = prev.find(e => e.id === id);
                if (!eventToDelete) return prev.filter((e) => e.id !== id);

                // action 1 = All days, action 2 = All days or This and Following
                // UI passes 2 for "Delete for all days"
                if (action === 1 || action === 2) {
                    // Determine the Master ID to remove the whole series
                    let masterId: string | null = null;
                    if (eventToDelete.rrule) {
                        try {
                            const parsed = JSON.parse(eventToDelete.rrule);
                            masterId = parsed.seriesMasterId || eventToDelete.externalId;
                        } catch {
                            masterId = eventToDelete.externalId;
                        }
                    } else {
                        masterId = eventToDelete.externalId;
                    }

                    // For optimistic series deletion, the masterId might be an occurrence ID
                    // if we clicked on an optimistic one. Backend strips _occ_, we should too.
                    const cleanMasterId = masterId!.split('_occ_')[0];

                    return prev.filter((e) => {
                        // Direct ID match
                        if (e.id === id) return false;

                        // Check if this event belongs to the same series
                        const currentMasterId = e.externalId?.split('_occ_')[0];
                        if (currentMasterId === cleanMasterId) return false;

                        // Check RRULE for series membership
                        if (e.rrule && (e.rrule.includes(cleanMasterId) || e.rrule.includes(masterId!))) return false;

                        return true;
                    });
                }

                // Delete single occurrence or non-recurring event
                return prev.filter((e) => e.id !== id);
            });

            setSuccessMessage("Event deleted successfully!");
            return true;
        } catch (err: any) {
            setError(err.message || "Failed to delete event");
            return false;
        } finally {
            setLoading(false);
        }
    }, []); // Keep these, events handled by functional update

    const syncAll = useCallback(async (provider?: CalendarProvider) => {
        try {
            setSyncing(true);
            setError(null);

            // If no provider passed, try to detect from current events
            const targetProvider = (typeof provider === 'string' ? provider : undefined) || (events.length > 0 ? events[0].provider : undefined);

            if (!targetProvider) {
                throw new Error("No connected calendar integration found to sync.");
            }

            await CalendarService.syncAll(targetProvider);
            setSuccessMessage(`${targetProvider} Calendar sync initiated...`);

            let attempts = 0;
            const maxAttempts = 15; // 30 seconds total
            const interval = 2000; // 2 seconds

            const poll = async () => {
                try {
                    const status = await CalendarService.getStatus(targetProvider);
                    if (status.isSyncing) {
                        attempts++;
                        if (attempts < maxAttempts) {
                            setTimeout(poll, interval);
                        } else {
                            setSyncing(false);
                            setSuccessMessage(`${targetProvider} Calendar sync initiated in background, but taking longer than expected.`);
                            await fetchEvents({
                                ...lastFiltersRef.current,
                                cacheBuster: Date.now()
                            });
                        }
                    } else {
                        setSyncing(false);
                        setSuccessMessage(`${targetProvider} Calendar synced successfully.`);
                        await fetchEvents({
                            ...lastFiltersRef.current,
                            cacheBuster: Date.now()
                        });
                    }
                } catch (pollErr: any) {
                    console.error("Failed to check sync status:", pollErr);
                    setSyncing(false);
                    await fetchEvents({
                        ...lastFiltersRef.current,
                        cacheBuster: Date.now()
                    });
                }
            };

            setTimeout(poll, interval);
        } catch (err: any) {
            setError(err.message || "Failed to sync events");
            setSyncing(false);
        }
    }, [fetchEvents, events]);

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
