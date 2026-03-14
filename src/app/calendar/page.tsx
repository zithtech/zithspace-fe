

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
import EventModal from "@/components/calendar/EventModal";
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
    const [showModal, setShowModal] = useState(false);
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
        setShowModal(true);
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
        setShowModal(false);
        setTimeout(() => setShowModal(true), 0);
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
            setShowModal(false);
        } catch (error) {
            console.error("Error saving event:", error);
        }
    };


    const handleDeleteEvent = async (action?: number, occurrenceDate?: string) => {
        if (selectedEvent) {
            const finalOccurrenceDate = occurrenceDate || selectedOccurrenceDate?.toISOString();
            const ok = await deleteEvent(selectedEvent.id, action, finalOccurrenceDate);
            if (ok) setShowModal(false);
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
        <MainLayout>
            <Layout style={{ height: 'calc(100vh - 64px)', background: '#fff' }}>
                <Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
                    <CalendarSidebar
                        selectedDate={currentDate}
                        onDateSelect={setCurrentDate}
                        selectedCalendars={selectedCalendars}
                        onCalendarChange={setSelectedCalendars}
                        provider={connectedProvider}
                        onSync={() => syncAll(connectedProvider!)}
                        syncing={syncing}
                    />
                </Sider>

                <Layout>
                    {/* NEW: Provider Banner */}
                    <div style={{
                        padding: '12px 24px',
                        background: providerInfo.color + '10', // 10% opacity
                        borderBottom: `2px solid ${providerInfo.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                fontSize: 24,
                                color: providerInfo.color,
                                background: 'white',
                                padding: 8,
                                borderRadius: '50%',
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {providerInfo.icon}
                            </div>
                            <div>
                                <Title level={5} style={{ margin: 0, color: providerInfo.color }}>
                                    Connected Calendar
                                </Title>
                                <Text strong style={{ fontSize: 16 }}>
                                    {providerInfo.name}
                                </Text>
                            </div>
                        </div>
                        {!connectedProvider && (
                            <Button type="primary" href="/integrations">
                                Connect Calendar
                            </Button>
                        )}
                    </div>

                    <CalendarToolbar
                        view={view}
                        onViewChange={setView}
                        onNavigate={handleNavigate}
                        currentDateRange={formatRange()}
                        onCreateEvent={() => {
                            if (!connectedProvider) {
                                message.warning('Please connect a calendar first');
                                return;
                            }
                            setSelectedEvent(null);
                            setInitialDateForModal(currentDate);
                            setShowModal(true);
                        }}
                    />

                    <Content style={{ position: 'relative', overflow: 'auto' }}>
                        {!connectedProvider ? (
                            <div style={{
                                textAlign: 'center',
                                padding: 80,
                                background: '#fafafa',
                                borderRadius: 8,
                                margin: 24
                            }}>
                                <CalendarOutlined style={{ fontSize: 48, color: '#ccc' }} />
                                <Title level={3} style={{ marginTop: 16 }}>
                                    No Calendar Connected
                                </Title>
                                <Text type="secondary">
                                    Connect a calendar to start managing your events
                                </Text>
                                <div style={{ marginTop: 24 }}>
                                    <Button type="primary" size="large" href="/integrations">
                                        Connect Calendar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}

                        {loading && !syncing && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(255,255,255,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10
                            }}>
                                <div className="ant-spin-spinning" style={{ fontSize: 32 }} />
                            </div>
                        )}
                    </Content>
                </Layout>
            </Layout>

            <EventModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSaveEvent}
                onDelete={selectedEvent ? handleDeleteEvent : undefined}
                editEvent={selectedEvent}
                initialDate={initialDateForModal}
                loading={loading}
                error={error}
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
