"use client";

import React, { Suspense, useState, useEffect } from "react";
import { Layout, Typography, App as AntApp } from "antd";

const { Title } = Typography;
import MainLayout from "@/components/layout/MainLayout";
import { useZohoCalendar } from "@/hooks/useZohoCalendar";
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
    } = useZohoCalendar();

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

    // Fetch events when date or view changes (simplified for now to month-based)
    useEffect(() => {
        if (status?.connected) {
            const start = currentDate.startOf('month').toISOString();
            const end = currentDate.endOf('month').toISOString();
            fetchEvents({ startDate: start, endDate: end });
        }
    }, [currentDate, status?.connected, fetchEvents]);

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
        setShowModal(false); // Close first if open
        setTimeout(() => setShowModal(true), 0);
    };

    const handleSaveEvent = async (data: any) => {
        if (selectedEvent) {
            await updateEvent(selectedEvent.id, data);
        } else {
            await createEvent(data);
        }
        setShowModal(false);
    };

    const handleDeleteEvent = async (action?: number, occurrenceDate?: string) => {
        if (selectedEvent) {
            const start = currentDate.startOf('month').toISOString();
            const end = currentDate.endOf('month').toISOString();
            // Use selectedOccurrenceDate if provided (e.g. from clicking an occurrence)
            const finalOccurrenceDate = occurrenceDate || selectedOccurrenceDate?.toISOString();
            const ok = await deleteEvent(selectedEvent.id, action, finalOccurrenceDate, { start, end });
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

    return (
        <MainLayout>
            <Layout style={{ height: 'calc(100vh - 64px)', background: '#fff' }}>
                <Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
                    <CalendarSidebar
                        selectedDate={currentDate}
                        onDateSelect={setCurrentDate}
                        selectedCalendars={selectedCalendars}
                        onCalendarChange={setSelectedCalendars}
                        zohoStatus={status}
                        onConnect={connect}
                        onDisconnect={disconnect}
                        onSync={syncEvents}
                        isConnecting={isConnecting}
                        isDisconnecting={isDisconnecting}
                        syncingZoho={syncing}
                    />
                </Sider>

                <Layout>
                    <CalendarToolbar
                        view={view}
                        onViewChange={setView}
                        onNavigate={handleNavigate}
                        currentDateRange={formatRange()}
                        onCreateEvent={() => {
                            setSelectedEvent(null);
                            setInitialDateForModal(currentDate);
                            setShowModal(true);
                        }}
                    />

                    <Content style={{ position: 'relative', overflow: 'auto' }}>
                        {view === 'month' && (
                            <MonthView
                                currentDate={currentDate}
                                events={events.filter(e => selectedCalendars.includes(e.calendar || 'Personal Calendar'))}
                                onDayClick={handleDayClick}
                                onEventClick={handleEventClick}
                            />
                        )}
                        {view === 'week' && (
                            <WeekView
                                currentDate={currentDate}
                                events={events.filter(e => selectedCalendars.includes(e.calendar || 'Personal Calendar'))}
                                onEventClick={handleEventClick}
                                onTimeSlotClick={handleDayClick}
                            />
                        )}
                        {view === 'day' && (
                            <DayView
                                currentDate={currentDate}
                                events={events.filter(e => selectedCalendars.includes(e.calendar || 'Personal Calendar'))}
                                onEventClick={handleEventClick}
                                onTimeSlotClick={handleDayClick}
                            />
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
                                <div className="ant-spin-spinning" />
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
