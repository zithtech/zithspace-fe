

"use client";

import React, { Suspense, useState, useEffect } from "react";
import { Layout, Typography, Button, App as AntApp, Tag } from "antd";
import { CalendarOutlined, GoogleOutlined, WindowsOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
import MainLayout from "@/components/layout/MainLayout";
import { useCalendar } from "@/hooks/useCalendar";
import { CalendarService, CalendarProvider } from "@/services/calendarService";
import CalendarSidebar from "@/components/calendar/CalendarSidebar";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import DayView from "@/components/calendar/DayView";
import EventFormDrawer from "@/components/calendar/EventFormDrawer";
import EventDrawer from "@/components/calendar/EventDrawer";
import dayjs, { Dayjs } from "dayjs";

const { Sider, Content } = Layout;

function CalendarPageContent() {
    const {
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
    } = useCalendar();

    const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [showFormDrawer, setShowFormDrawer] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedOccurrenceDate, setSelectedOccurrenceDate] = useState<Dayjs | null>(null);
    const [initialDateForModal, setInitialDateForModal] = useState<Dayjs | undefined>();
    const [selectedCalendars, setSelectedCalendars] = useState<string[]>([
        'Personal Calendar',
        'Team Calendar',
        'Company Holidays',
        'Approved Leaves',
        'Project Milestones'
    ]);

    // NEW: State for connected provider
    const [connectedProvider, setConnectedProvider] = useState<CalendarProvider | null>(null);

    const { message } = AntApp.useApp();

    // Handle messages
    useEffect(() => {
        if (successMessage) {
            message.success(successMessage);
            clearMessages();
        }
        if (error) {
            message.error(error);
            clearMessages();
        }
    }, [successMessage, error, clearMessages, message]);

    // Fetch events when date changes
    useEffect(() => {
        const start = currentDate.startOf('month').toISOString();
        const end = currentDate.endOf('month').toISOString();
        fetchEvents({ startDate: start, endDate: end });
    }, [currentDate, fetchEvents]);

    // NEW: Fetch connected provider
    useEffect(() => {
        const fetchConnectedProvider = async () => {
            const providers: CalendarProvider[] = ['GOOGLE', 'ZOHO', 'MICROSOFT'];
            for (const provider of providers) {
                try {
                    const status = await CalendarService.getStatus(provider);
                    if (status.connected) {
                        setConnectedProvider(provider);
                        break;
                    }
                } catch (error) {
                    console.error(`Failed to get ${provider} status:`, error);
                }
            }
        };

        fetchConnectedProvider();
    }, []);

    // NEW: Get provider info for UI
    const getProviderInfo = (provider: CalendarProvider | null) => {
        switch (provider) {
            case 'GOOGLE':
                return {
                    name: 'Google Calendar',
                    icon: <GoogleOutlined />,
                    color: '#62bc77'
                };
            case 'ZOHO':
                return {
                    name: 'Zoho Calendar',
                    icon: <CalendarOutlined />,
                    color: '#62bc77'
                };
            case 'MICROSOFT':
                return {
                    name: 'Microsoft Outlook',
                    icon: <WindowsOutlined />,
                    color: '#62bc77'
                };
            default:
                return {
                    name: 'No Calendar Connected',
                    icon: <CalendarOutlined />,
                    color: '#999'
                };
        }
    };

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') setCurrentDate(dayjs());
        else if (direction === 'prev') setCurrentDate(currentDate.subtract(1, view));
        else setCurrentDate(currentDate.add(1, view));
    };

    const handleDayClick = (date: Dayjs) => {
        setInitialDateForModal(date);
        setSelectedEvent(null);
        setShowFormDrawer(true);
    };

    const handleEventClick = (event: any, occurrenceDate?: Dayjs) => {
        if (occurrenceDate) {
            const start = dayjs(event.startTime);
            const end = dayjs(event.endTime);
            const duration = end.diff(start);

            const newStart = occurrenceDate.toISOString();
            const newEnd = occurrenceDate.add(duration, 'ms').toISOString();

            setSelectedEvent({
                ...event,
                startTime: newStart,
                endTime: newEnd
            });
            setSelectedOccurrenceDate(occurrenceDate);
        } else {
            setSelectedEvent(event);
            setSelectedOccurrenceDate(null);
        }
        setShowDrawer(true);
    };

    const handleEditFromDrawer = (event: any) => {
        setShowDrawer(false);
        setInitialDateForModal(undefined);
        setShowFormDrawer(true);
    };

    const handleDeleteFromDrawer = async (event: any, action?: number) => {
        if (event) {
            const finalOccurrenceDate = selectedOccurrenceDate?.toISOString();
            const ok = await deleteEvent(event.id, action, finalOccurrenceDate);
            if (ok) setShowDrawer(false);
        }
    };

    // const handleSaveEvent = async (data: any) => {
    //     if (selectedEvent) {
    //         await updateEvent(selectedEvent.id, data);
    //     } else {
    //         // NEW: Automatically add the connected provider to new events
    //         await createEvent({ ...data, provider: connectedProvider });
    //     }
    //     setShowModal(false);
    // };


    const handleSaveEvent = async (data: any) => {
        console.log("🟢 CalendarPage received:", data);
        console.log("🟢 GenerateMeeting received:", data.generateMeeting);

        try {
            if (selectedEvent) {
                console.log("🟢 Updating existing event");
                await updateEvent(selectedEvent.id, data);
            } else {
                if (!connectedProvider) {
                    message.error("No calendar connected. Please connect a calendar first.");
                    return;
                }

                console.log("🟢 Connected provider:", connectedProvider);

                const eventToCreate = {
                    title: data.title,
                    description: data.description,
                    location: data.location,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    isRecurring: data.isRecurring,
                    isAllDay: data.isAllDay,
                    calendar: data.calendar,
                    sourceType: data.sourceType,
                    attendees: data.attendees,
                    generateMeeting: data.generateMeeting,
                    recurringDays: data.recurringDays,
                    provider: connectedProvider
                };

                console.log("🟢 Event to create:", eventToCreate);
                console.log("🟢 GenerateMeeting in create:", eventToCreate.generateMeeting);

                await createEvent(eventToCreate);
            }
            setShowFormDrawer(false);
        } catch (error) {
            console.error("Error saving event:", error);
        }
    };


    const handleDeleteEvent = async (action?: number, occurrenceDate?: string) => {
        if (selectedEvent) {
            const finalOccurrenceDate = occurrenceDate || selectedOccurrenceDate?.toISOString();
            const ok = await deleteEvent(selectedEvent.id, action, finalOccurrenceDate);
            if (ok) {
                setShowFormDrawer(false);
                setShowDrawer(false);
            }
        }
    };

    const formatRange = () => {
        if (view === 'month') return currentDate.format('MMMM YYYY');
        if (view === 'day') return currentDate.format('MMMM D, YYYY');
        const start = currentDate.startOf('week');
        const end = currentDate.endOf('week');
        return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`;
    };

    // NEW: Filter events to ONLY show the connected provider's events
    const filteredEvents = connectedProvider
        ? events.filter(e => e.provider === connectedProvider)
        : [];

    const providerInfo = getProviderInfo(connectedProvider);

    return (
        <MainLayout noPadding={true}>
            <div style={{ 
                height: 'calc(100vh - 64px)', 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <CalendarToolbar
                    view={view}
                    onViewChange={setView}
                    onNavigate={handleNavigate}
                    currentDateRange={formatRange()}
                    provider={connectedProvider}
                    providerInfo={providerInfo}
                    onSync={() => syncAll(connectedProvider!)}
                    syncing={syncing}
                    onCreateEvent={() => {
                        if (!connectedProvider) {
                            message.warning('Please connect a calendar first');
                            return;
                        }
                        setSelectedEvent(null);
                        setInitialDateForModal(currentDate);
                        setShowFormDrawer(true);
                    }}
                />

                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    overflow: 'hidden', 
                    padding: '16px', 
                    gap: '16px',
                    minHeight: 0
                }}>
                    <Sider 
                        width={240} 
                        theme="light" 
                        className="no-scrollbar"
                        style={{ 
                            background: 'transparent',
                            height: '100%',
                            border: 'none',
                            boxShadow: 'none',
                            overflowY: 'auto',
                            flexShrink: 0
                        }}
                    >
                        <CalendarSidebar
                            selectedDate={currentDate}
                            onDateSelect={setCurrentDate}
                            selectedCalendars={selectedCalendars}
                            onCalendarChange={setSelectedCalendars}
                            provider={connectedProvider}
                        />
                    </Sider>

                    <div style={{ 
                        flex: 1,
                        position: 'relative', 
                        overflow: 'hidden', 
                        display: 'flex', 
                        flexDirection: 'column',
                        background: '#fff',
                        borderRadius: '16px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        minHeight: 0
                    }}>
                        {!connectedProvider ? (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 80,
                                background: '#fff',
                            }}>
                                <div style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '24px',
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 24,
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.04)'
                                }}>
                                    <CalendarOutlined style={{ fontSize: 36, color: '#3b82f6' }} />
                                </div>
                                <Title level={3} style={{ 
                                    marginTop: 0, 
                                    marginBottom: 12, 
                                    fontWeight: 700,
                                    color: '#1e293b',
                                    letterSpacing: '-0.02em'
                                }}>
                                    Connect Your Calendar
                                </Title>
                                <Text style={{ 
                                    fontSize: 16, 
                                    maxWidth: 420, 
                                    textAlign: 'center', 
                                    marginBottom: 32,
                                    color: '#64748b',
                                    lineHeight: 1.6
                                }}>
                                    Sync your Google, Zoho, or Outlook calendar to manage all your meetings and schedules in one premium interface.
                                </Text>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    href="/integrations"
                                    style={{ 
                                        height: 52, 
                                        padding: '0 40px', 
                                        borderRadius: '14px',
                                        fontSize: 16,
                                        fontWeight: 700,
                                        background: '#3b82f6',
                                        border: 'none',
                                        boxShadow: '0 10px 20px rgba(59, 130, 246, 0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                >
                                    Go to Integrations
                                </Button>
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                {view === 'month' && (
                                    <MonthView
                                        currentDate={currentDate}
                                        events={filteredEvents.filter(e => selectedCalendars.includes(e.calendar || 'Personal Calendar'))}
                                        onDayClick={handleDayClick}
                                        onEventClick={handleEventClick}
                                    />
                                )}
                                {view === 'week' && (
                                    <WeekView
                                        currentDate={currentDate}
                                        events={filteredEvents.filter(e => selectedCalendars.includes(e.calendar || 'Personal Calendar'))}
                                        onEventClick={handleEventClick}
                                        onTimeSlotClick={handleDayClick}
                                    />
                                )}
                                {view === 'day' && (
                                    <DayView
                                        currentDate={currentDate}
                                        events={filteredEvents.filter(e => selectedCalendars.includes(e.calendar || 'Personal Calendar'))}
                                        onEventClick={handleEventClick}
                                        onTimeSlotClick={handleDayClick}
                                    />
                                )}
                            </div>
                        )}

                        {loading && !syncing && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(255,255,255,0.7)',
                                backdropFilter: 'blur(4px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 50
                            }}>
                                <div className="ant-spin-spinning" style={{ fontSize: 32 }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <EventFormDrawer
                open={showFormDrawer}
                onClose={() => setShowFormDrawer(false)}
                onSave={handleSaveEvent}
                onDelete={selectedEvent ? handleDeleteEvent : undefined}
                editEvent={selectedEvent}
                initialDate={initialDateForModal}
                loading={loading}
                error={error}
            />

            <EventDrawer
                open={showDrawer}
                onClose={() => setShowDrawer(false)}
                event={selectedEvent}
                onEdit={handleEditFromDrawer}
                onDelete={handleDeleteFromDrawer}
                loading={loading}
            />
        </MainLayout>
    );
}

export default function CalendarPage() {
    return (
        <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>Loading Calendar...</div>}>
            <CalendarPageContent />
        </Suspense>
    );
}
