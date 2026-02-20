import { api, ApiError } from "@/lib/axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ZohoEvent {
    id: string;
    eventId: string;
    calendarId: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    location: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
    etag?: string;
    isAllDay?: boolean;
    isRecurring?: boolean;
    rrule?: string | null;
    calendar?: string;
    sourceType?: string;
    attendees?: string[] | any;
    meetingLink?: string | null;
    exdate?: string | string[] | any;
    recurrence?: {
        frequency: string;
        until?: string;
    };
}

export interface ZohoStatus {
    connected: boolean;
    calendarId: string | null;
    tokenExpiry: string | null;
    lastSync: string | null;
}

export interface CreateEventData {
    title: string;
    description?: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    location?: string;
    isRecurring?: boolean;
    isAllDay?: boolean;
    calendar?: string;
    sourceType?: string;
    attendees?: string[];
    generateMeeting?: boolean;
    meetingLink?: string;
}

export interface UpdateEventData {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    isRecurring?: boolean;
    isAllDay?: boolean;
    calendar?: string;
    sourceType?: string;
    attendees?: string[];
    generateMeeting?: boolean;
    meetingLink?: string;
}

export interface EventFilters {
    startDate?: string;
    endDate?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ZohoCalendarService {
    /**
     * Get Zoho connection status for the current user.
     */
    static async getStatus(): Promise<ZohoStatus> {
        try {
            return await api.get<ZohoStatus>("/api/zoho/status");
        } catch (error) {
            if (error instanceof ApiError) throw new Error(error.message);
            throw new Error("Failed to get Zoho status");
        }
    }

    /**
     * Get the Zoho OAuth2 authorization URL.
     * Redirect the user to this URL to connect their account.
     */
    static async getConnectUrl(): Promise<string> {
        try {
            const data = await api.get<{ authUrl: string }>("/api/zoho/connect");
            return data.authUrl;
        } catch (error) {
            if (error instanceof ApiError) throw new Error(error.message);
            throw new Error("Failed to get Zoho connect URL");
        }
    }

    /**
     * Disconnect the user's Zoho account.
     */
    static async disconnect(): Promise<void> {
        try {
            await api.post("/api/zoho/disconnect", {});
        } catch (error) {
            if (error instanceof ApiError) throw new Error(error.message);
            throw new Error("Failed to disconnect Zoho account");
        }
    }

    /**
     * Fetch events from Zoho Calendar (syncs to DB).
     */
    static async getEvents(filters: EventFilters = {}): Promise<ZohoEvent[]> {
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.set("startDate", filters.startDate);
            if (filters.endDate) params.set("endDate", filters.endDate);
            const query = params.toString() ? `?${params.toString()}` : "";
            return await api.get<ZohoEvent[]>(`/api/zoho/events${query}`);
        } catch (error) {
            if (error instanceof ApiError) throw new Error(error.message);
            throw new Error("Failed to fetch Zoho events");
        }
    }

    /**
     * Create a new event on Zoho Calendar.
     */
    static async createEvent(data: CreateEventData): Promise<ZohoEvent> {
        try {
            return await api.post<ZohoEvent>("/api/zoho/events", data);
        } catch (error) {
            if (error instanceof ApiError) throw new Error(error.message);
            throw new Error("Failed to create Zoho event");
        }
    }

    /**
     * Update an existing event on Zoho Calendar.
     */
    static async updateEvent(id: string, data: UpdateEventData): Promise<ZohoEvent> {
        try {
            return await api.put<ZohoEvent>(`/api/zoho/events/${id}`, data);
        } catch (error) {
            if (error instanceof ApiError) throw new Error(error.message);
            throw new Error("Failed to update Zoho event");
        }
    }

    /**
     * Delete an event from Zoho Calendar.
     */
    static async deleteEvent(id: string, action?: number, occurrenceDate?: string): Promise<void> {
        try {
            const params = new URLSearchParams();
            if (action !== undefined) params.set("action", action.toString());
            if (occurrenceDate) params.set("occurrenceDate", occurrenceDate);
            const query = params.toString() ? `?${params.toString()}` : "";

            await api.delete(`/api/zoho/events/${id}${query}`);
        } catch (error) {
            if (error instanceof ApiError) throw new Error(error.message);
            throw new Error("Failed to delete Zoho event");
        }
    }

    /**
     * Full sync: fetch all upcoming events from Zoho and upsert to DB.
     */
    static async syncEvents(): Promise<{ synced: number }> {
        try {
            return await api.post<{ synced: number }>("/api/zoho/sync", {});
        } catch (error) {
            if (error instanceof ApiError) throw new Error(error.message);
            throw new Error("Failed to sync Zoho events");
        }
    }
}
