import { useState, useEffect } from 'react';
import { CalendarService, CalendarProvider } from '@/services/calendarService';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';

interface DynamicCalendarReturn {
    status: string;
    events: any[];
    loading: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    syncEvents: () => Promise<void>;
    error: string | null;
    successMessage: string | null;
}

export function useDynamicCalendar(): DynamicCalendarReturn {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('disconnected');

    useEffect(() => {
        const initializeCalendar = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get user's connected calendar providers
                const providers = await CalendarService.getConnectedProviders();
                console.log(`[useDynamicCalendar] Connected providers:`, providers);

                if (providers.length === 0) {
                    setStatus('disconnected');
                    setEvents([]);
                    setLoading(false);
                    return;
                }

                // Use the first connected provider
                const primaryProvider = providers[0] as CalendarProvider;
                setStatus(`connected (${primaryProvider})`);

                // Fetch events from connected provider
                const calendarEvents = await CalendarService.getEvents();
                setEvents(calendarEvents || []);
                setSuccessMessage(`${primaryProvider} calendar connected successfully!`);

            } catch (err: any) {
                setError(err.message || 'Failed to load calendar');
                setStatus('error');
            } finally {
                setLoading(false);
            }
        };

        initializeCalendar();
    }, [user]);

    const connect = async () => {
        // This would open provider selection/connection flow
        console.log(`[useDynamicCalendar] Connect calendar requested`);
    };

    const disconnect = async () => {
        try {
            setLoading(true);
            const providers = await CalendarService.getConnectedProviders();
            if (providers.length > 0) {
                const primaryProvider = providers[0] as CalendarProvider;
                await CalendarService.disconnect(primaryProvider);
            }
            setStatus('disconnected');
            setEvents([]);
            setSuccessMessage('Calendar disconnected successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to disconnect calendar');
        } finally {
            setLoading(false);
        }
    };

    const syncEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const providers = await CalendarService.getConnectedProviders();
            if (providers.length > 0) {
                const primaryProvider = providers[0] as CalendarProvider;
                await CalendarService.syncAll(primaryProvider);
                const calendarEvents = await CalendarService.getEvents();
                setEvents(calendarEvents || []);
                setSuccessMessage(`${primaryProvider} calendar synced successfully!`);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to sync calendar');
        } finally {
            setLoading(false);
        }
    };

    return {
        status,
        events,
        loading,
        connect,
        disconnect,
        syncEvents,
        error,
        successMessage,
    };
}
