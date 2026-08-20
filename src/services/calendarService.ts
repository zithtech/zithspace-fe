import { api, ApiError } from "@/lib/axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CalendarProvider = "ZOHO" | "GOOGLE" | "MICROSOFT";

export interface CalendarEvent {
    id: string;
    provider: CalendarProvider;
    externalId: string;
    calendarId: string | null;
    title: string;
    description: string | null;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    location: string | null;
    userId: string;
    tenantId: string;
    isAllDay: boolean;
    isRecurring: boolean;
    rrule: string | null;
    meetingLink: string | null;
    calendar: string | null;
    sourceType: string | null;
    attendees: any;
    exdate: any;
    createdAt: string;
    updatedAt: string;
    occurrenceDate?: string;
}

export interface CalendarStatus {
    connected: boolean;
    provider: string;
    lastSync: string | null;
    isSyncing?: boolean;
}

export interface CreateEventData {
    provider: CalendarProvider;
    title: string;
    description?: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    location?: string;
    isRecurring?: boolean;
    isAllDay?: boolean;
    attendees?: string[];
    generateMeeting?: boolean;
    recurringDays?: string[];
}

export interface UpdateEventData {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    isRecurring?: boolean;
    isAllDay?: boolean;
    attendees?: string[];
    generateMeeting?: boolean;
    recurringDays?: string[];
    action?: number;
    occurrenceDate?: string;
}

export interface EventFilters {
    startDate?: string;
    endDate?: string;
    cacheBuster?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class CalendarService {
    /**
     * Get connection status for a specific provider.
     */
    static async getStatus(provider: CalendarProvider): Promise<CalendarStatus> {
        try {
            return await api.get<CalendarStatus>(`/api/calendar/${provider}/status`);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error(`Failed to get ${provider} status`);
        }
    }

    /**
     * Get all connected calendar providers.
     */
    static async getConnectedProviders(): Promise<CalendarProvider[]> {
        try {
            return await api.get<CalendarProvider[]>(`/api/calendar/providers`);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error('Failed to get connected providers');
        }
    }

    /**
     * Get the OAuth2 authorization URL for a provider.
     */
    static async getConnectUrl(provider: CalendarProvider): Promise<string> {
        try {
            const data = await api.get<{ authUrl: string }>(`/api/calendar/${provider}/connect`);
            return data.authUrl;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error(`Failed to get ${provider} connect URL`);
        }
    }

    /**
     * Disconnect a provider account.
     */
    static async disconnect(provider: CalendarProvider): Promise<void> {
        try {
            await api.post(`/api/calendar/${provider}/disconnect`, {});
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error(`Failed to disconnect ${provider} account`);
        }
    }

    /**
     * Check for any overlapping events for the current user.
     */
    static async checkOverlap(startTime: string, endTime: string, excludeEventId?: string): Promise<{ hasOverlap: boolean; count: number; overlaps: any[] }> {
        try {
            return await api.post<{ hasOverlap: boolean; count: number; overlaps: any[] }>("/api/calendar/events/check-overlap", {
                startTime,
                endTime,
                excludeEventId
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error("Failed to check for event overlaps");
        }
    }

    /**
     * Fetch events from all connected calendars.
     */
    static async getEvents(filters: EventFilters = {}): Promise<CalendarEvent[]> {
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.set("startDate", filters.startDate);
            if (filters.endDate) params.set("endDate", filters.endDate);
            if (filters.cacheBuster) params.set("cacheBuster", filters.cacheBuster.toString());
            const query = params.toString() ? `?${params.toString()}` : "";
            return await api.get<CalendarEvent[]>(`/api/calendar/events${query}`);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error("Failed to fetch calendar events");
        }
    }

    /**
     * Create a new event on a specific provider.
     */
    static async createEvent(data: CreateEventData): Promise<CalendarEvent> {
        try {
            return await api.post<CalendarEvent>("/api/calendar/events", data);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error(`Failed to create event on ${data.provider}`);
        }
    }

    /**
     * Update an existing event.
     */
    static async updateEvent(id: string, data: UpdateEventData): Promise<CalendarEvent> {
        try {
            return await api.put<CalendarEvent>(`/api/calendar/events/${id}`, data);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error("Failed to update event");
        }
    }

    /**
     * Delete an event.
     */
    static async deleteEvent(id: string, action?: number, occurrenceDate?: string): Promise<void> {
        try {
            const params = new URLSearchParams();
            if (action !== undefined) params.set("action", action.toString());
            if (occurrenceDate) params.set("occurrenceDate", occurrenceDate);
            const query = params.toString() ? `?${params.toString()}` : "";
            await api.delete(`/api/calendar/events/${id}${query}`);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error("Failed to delete event");
        }
    }

    /**
     * Sync connected calendars.
     * If a provider is specified, only that provider will be synced.
     */
    static async syncAll(provider?: CalendarProvider): Promise<any[]> {
        try {
            const data = await api.post<any[]>("/api/calendar/sync", { provider });
            return data;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error(`Failed to sync ${provider || "all"} calendars`);
        }
    }
}
