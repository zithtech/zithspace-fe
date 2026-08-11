"use client";


import { useActivitySource } from '@/hooks/useActivitySource';
import React, { Suspense, useState, useEffect } from "react";
import { Layout, Typography, Button, App as AntApp } from "antd";
import {
    CalendarOutlined,
    GoogleOutlined,
    WindowsOutlined,
    LoadingOutlined,
    ArrowRightOutlined
} from "@ant-design/icons";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

const { Title, Text } = Typography;
import MainLayout from "@/components/layout/MainLayout";
import { useCalendar } from "@/hooks/useCalendar";
import { usePermission } from "@/hooks/usePermission";
import { CalendarService, CalendarProvider } from "@/services/calendarService";
import CalendarSidebar from "@/components/calendar/CalendarSidebar";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import DayView from "@/components/calendar/DayView";
import EventFormDrawer from "@/components/calendar/EventFormDrawer";
import EventDrawer from "@/components/calendar/EventDrawer";
import dayjs, { Dayjs } from "dayjs";
import ZukvoLoader from "@/components/common/ZukvoLoader";

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
        clearMessages } = useCalendar();

    const {
        canCreateCalendar,
        canUpdateCalendar,
        canDeleteCalendar,
        canManageCalendar
    } = usePermission();

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

    const [connectedProvider, setConnectedProvider] = useState<CalendarProvider | null>(null);
    const [providerLoading, setProviderLoading] = useState(true);

    const { message } = AntApp.useApp();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const processedConnection = React.useRef(false);

    useEffect(() => {
        if (searchParams && searchParams.get('connected') === 'true' && !processedConnection.current) {
            processedConnection.current = true;
            const provider = searchParams.get('provider') as CalendarProvider;
            if (provider) {
                setConnectedProvider(provider);
                // syncAll already displays success messages
                syncAll(provider);
                router.replace(pathname || '/calendar');
            }
        }
    }, [searchParams, pathname, router, syncAll]);

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

    useEffect(() => {
        const start = currentDate.startOf('month').toISOString();
        const end = currentDate.endOf('month').toISOString();
        fetchEvents({ startDate: start, endDate: end });
    }, [currentDate, fetchEvents]);

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
            setProviderLoading(false);
        };

        fetchConnectedProvider();
    }, []);

    const getProviderInfo = (provider: CalendarProvider | null) => {
        switch (provider) {
            case 'GOOGLE':
                return { name: 'Google Calendar', icon: <GoogleOutlined />, color: '#EA4335' };
            case 'ZOHO':
                return { name: 'Zoho Calendar', icon: <CalendarOutlined />, color: '#E42527' };
            case 'MICROSOFT':
                return { name: 'Microsoft Outlook', icon: <WindowsOutlined />, color: '#0078D4' };
            default:
                return { name: 'Not connected', icon: <CalendarOutlined />, color: 'var(--cal-text-faint)' };
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

    const handleSaveEvent = async (data: any) => {
        try {
            if (selectedEvent) {
                await updateEvent(selectedEvent.id, data);
            } else {
                if (!connectedProvider) {
                    message.error("No calendar connected. Please connect a calendar first.");
                    return;
                }

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

    const filteredEvents = connectedProvider
        ? events.filter(e => e.provider === connectedProvider)
        : [];

    const providerInfo = getProviderInfo(connectedProvider);

    return (
        <MainLayout>
            <Layout
                className="cal-scope"
                style={{ height: 'calc(100vh - 64px)', background: 'var(--cal-canvas)' }}
            >
                <Sider
                    width={288}
                    theme="light"
                    style={{
                        background: 'var(--bg-pure-white)',
                        borderRight: '1px solid var(--border-slate-200)',
                        overflow: 'auto',
                    }}
                >
                    <CalendarSidebar
                        selectedDate={currentDate}
                        onDateSelect={setCurrentDate}
                        selectedCalendars={selectedCalendars}
                        onCalendarChange={setSelectedCalendars}
                        provider={connectedProvider}
                        onSync={() => syncAll(connectedProvider!)}
                        syncing={syncing}
                        eventsForMonth={filteredEvents}
                        canSync={canManageCalendar}
                    />
                </Sider>

                <Layout style={{ background: 'var(--cal-canvas)' }}>
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
                            setShowFormDrawer(true);
                        }}
                        provider={connectedProvider}
                        providerName={providerInfo.name}
                        providerIcon={providerInfo.icon}
                        providerColor={providerInfo.color}
                        eventCount={filteredEvents.length}
                        canCreate={canCreateCalendar}
                    />



                    <Content style={{ position: 'relative', overflow: 'hidden', padding: '16px 24px 24px' }}>
                        <div
                            style={{
                                height: '100%',
                                background: 'var(--cal-surface)',
                                borderRadius: 16,
                                border: '1px solid var(--cal-border)',
                                boxShadow: 'var(--cal-card-shadow)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            {providerLoading ? (
                                <div style={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <ZukvoLoader size="md" />
                                </div>
                            ) : !connectedProvider ? (
                                <EmptyState />
                            ) : (
                                <>
                                    {view === 'month' && (
                                        <MonthView
                                            currentDate={currentDate}
                                            events={filteredEvents.filter(e => selectedCalendars.includes(e.calendar || 'Personal Calendar'))}
                                            onEventClick={handleEventClick}
                                            onTimeSlotClick={canCreateCalendar ? handleDayClick : undefined}
                                            onMoreClick={(date) => {
                                                setCurrentDate(date);
                                                setView('day');
                                            }}
                                        />
                                    )}
                                    {view === 'week' && (
                                        <WeekView
                                            currentDate={currentDate}
                                            events={filteredEvents.filter(e => selectedCalendars.includes(e.calendar || 'Personal Calendar'))}
                                            onEventClick={handleEventClick}
                                            onTimeSlotClick={canCreateCalendar ? handleDayClick : undefined}
                                        />
                                    )}
                                    {view === 'day' && (
                                        <DayView
                                            currentDate={currentDate}
                                            events={filteredEvents.filter(e => selectedCalendars.includes(e.calendar || 'Personal Calendar'))}
                                            onEventClick={handleEventClick}
                                            onTimeSlotClick={canCreateCalendar ? handleDayClick : undefined}
                                        />
                                    )}
                                </>
                            )}

                            {loading && !syncing && connectedProvider && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'var(--cal-loader-overlay)',
                                    backdropFilter: 'blur(2px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10
                                }}>
                                    <ZukvoLoader size="md" />
                                </div>
                            )}
                        </div>
                    </Content>
                </Layout>
            </Layout>

            <EventFormDrawer
                open={showFormDrawer}
                onClose={() => {
                    setShowFormDrawer(false);
                    setSelectedEvent(null);
                }}
                onSave={handleSaveEvent}
                onDelete={selectedEvent ? handleDeleteEvent : undefined}
                editEvent={selectedEvent}
                initialDate={initialDateForModal}
                loading={loading}
                error={error}
                canSave={selectedEvent ? canUpdateCalendar : canCreateCalendar}
                canDelete={canDeleteCalendar}
            />

            <EventDrawer
                event={selectedEvent}
                open={showDrawer}
                onClose={() => {
                    setShowDrawer(false);
                    setSelectedEvent(null);
                }}
                onEdit={handleEditFromDrawer}
                onDelete={handleDeleteFromDrawer}
                loading={loading}
                canEdit={canUpdateCalendar}
                canDelete={canDeleteCalendar}
            />
            <style jsx global>{`
                /* Align side layout background color with Proposals page */
                .cal-scope .ant-layout-sider {
                    background: var(--bg-pure-white) !important;
                    border-right-color: var(--border-slate-200) !important;
                }
                [data-theme='dark'] .cal-scope .ant-layout-sider {
                    border-right-color: #1F2937 !important;
                }

                /* Disable hover effect on the mini-calendar day cells */
                .cal-scope .mini-calendar .ant-picker-cell:hover .ant-picker-cell-inner {
                    background: transparent !important;
                }
                .cal-scope .mini-calendar .calendar-day-hover:hover {
                    background: transparent !important;
                }
            `}</style>
        </MainLayout>
    );
}

function EmptyState() {
    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
            textAlign: 'center',
            background: 'var(--cal-empty-grad)'
        }}>
            <div style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                boxShadow: '0 12px 32px -8px rgba(79, 70, 229, 0.45), inset 0 1px 0 rgba(255,255,255,0.25)'
            }}>
                <CalendarOutlined style={{ fontSize: 44, color: '#FFFFFF' }} />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 600, color: 'var(--cal-text-strong)' }}>
                Connect a calendar to get started
            </Title>
            <Text style={{ color: 'var(--cal-text-muted)', fontSize: 15, marginTop: 8, maxWidth: 460 }}>
                Bring your Google, Outlook or Zoho events into one beautiful, unified workspace — and let your team see what's planned at a glance.
            </Text>
            <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
                <Button
                    type="primary"
                    size="large"
                    href="/integrations"
                    style={{
                        height: 44,
                        padding: '0 22px',
                        borderRadius: 10,
                        background: 'var(--cal-brand)',
                        borderColor: 'var(--cal-brand)',
                        boxShadow: '0 4px 12px -2px rgba(79, 70, 229, 0.45)',
                        fontWeight: 600
                    }}
                >
                    Connect calendar <ArrowRightOutlined />
                </Button>
                <Button
                    size="large"
                    href="/integrations"
                    style={{
                        height: 44,
                        padding: '0 18px',
                        borderRadius: 10,
                        fontWeight: 500
                    }}
                >
                    Learn more
                </Button>
            </div>
            <div style={{ marginTop: 40, display: 'flex', gap: 28, color: 'var(--cal-text-faint)', fontSize: 12, fontWeight: 500 }}>
                <span><GoogleOutlined style={{ marginRight: 6, color: '#EA4335' }} /> Google</span>
                <span><WindowsOutlined style={{ marginRight: 6, color: '#0078D4' }} /> Outlook</span>
                <span><CalendarOutlined style={{ marginRight: 6, color: '#E42527' }} /> Zoho</span>
            </div>
        </div>
    );
}

export default function CalendarPage() {
    useActivitySource({ section: "HOME", module: "Integrations", page: "IntegrationCalendar" });
    return (
        <Suspense fallback={
            <div style={{ padding: 48, textAlign: 'center' }}>
                <ZukvoLoader size="md" />
            </div>
        }>
            <CalendarPageContent />
        </Suspense>
    );
}