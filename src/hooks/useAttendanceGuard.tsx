import React, { useState, useCallback } from 'react';
import { Modal, Button, App, Checkbox } from 'antd';
import { Clock, CalendarCheck } from 'lucide-react';
import { AttendanceService } from '@/services/attendanceService';
import { getDeviceLocation } from '@/lib/geolocation';

export function useAttendanceGuard() {
  const { message } = App.useApp();
  const [modalState, setModalState] = useState<{
    visible: boolean;
    isPaused: boolean;
    pendingAction: (() => Promise<void>) | null;
  }>({
    visible: false,
    isPaused: false,
    pendingAction: null,
  });

  const [loading, setLoading] = useState(false);
  const [optAction, setOptAction] = useState(true);

  // Styles matching daily-updates modal
  const edRow = (selected: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 12,
    userSelect: "none",
    border: `1px solid ${selected ? "#bfdbfe" : "var(--border-slate-200)"}`,
    background: selected ? "rgba(59,130,246,0.05)" : "var(--bg-pure-white)",
    transition: "all .12s ease",
  });
  const edIcon = (color: string): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: 10,
    flexShrink: 0,
    background: `${color}1A`,
    color,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  });
  const edTitle: React.CSSProperties = { display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-slate-900)" };
  const edDesc: React.CSSProperties = { display: "block", fontSize: 11.5, color: "var(--text-slate-500)", marginTop: 1 };

  const withAttendanceGuard = useCallback(async (action: () => Promise<void>) => {
    try {
      const today = await AttendanceService.getTodayAttendance();
      
      if (today.state === 'not_started' || today.state === 'paused') {
        setOptAction(true);
        setModalState({
          visible: true,
          isPaused: today.state === 'paused',
          pendingAction: action,
        });
        return;
      }
      
      // If already working, proceed directly
      await action();
    } catch (err) {
      console.error("Failed to check attendance:", err);
      // Fallback
      await action();
    }
  }, []);

  const handleAttendanceAction = async () => {
    const { isPaused, pendingAction } = modalState;
    if (!pendingAction) return;
    
    setLoading(true);
    try {
      const loc = await getDeviceLocation();
      if (isPaused) {
        await AttendanceService.resume({ resumeTimers: false, ...(loc ?? {}) });
      } else {
        await AttendanceService.clockIn(loc ?? undefined);
      }
      message.success(isPaused ? 'Attendance resumed' : 'Clocked in successfully');
      window.dispatchEvent(new Event('attendance:refresh'));
      setModalState(s => ({ ...s, visible: false, pendingAction: null }));
      await pendingAction();
    } catch (err: any) {
      message.error(err.message || 'Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleJustStartTimer = async () => {
    const { pendingAction } = modalState;
    if (!pendingAction) return;
    setModalState(s => ({ ...s, visible: false, pendingAction: null }));
    await pendingAction();
  };

  const handleCancel = () => {
    setModalState(s => ({ ...s, visible: false, pendingAction: null }));
  };

  const handleContinue = async () => {
    if (optAction) {
      await handleAttendanceAction();
    } else {
      await handleJustStartTimer();
    }
  };

  const AttendanceGuardModal = (
    <Modal
      open={modalState.visible}
      onCancel={handleCancel}
      footer={null}
      width={480}
      centered
      zIndex={2000}
      closable={false}
      styles={{
        content: { padding: 0, overflow: "hidden", borderRadius: 14 },
        body: { padding: 0 },
        mask: { backdropFilter: "blur(2px)", background: "rgba(15,23,42,0.45)" },
      }}
    >
      <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid var(--border-slate-100)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(22,119,255,0.12)", color: "#1677ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-slate-900)", letterSpacing: "-0.01em" }}>
              {modalState.isPaused ? "Timer Started" : "Timer Started"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-slate-500)" }}>
              {modalState.isPaused 
                ? "Your timer is about to resume. What about your attendance?"
                : "Your timer is about to start. What about your attendance?"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 22px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
        <label onClick={() => setOptAction((v) => !v)} style={{ ...edRow(optAction), cursor: "pointer" }}>
          <span style={edIcon("#3B82F6")}><CalendarCheck size={18} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={edTitle}>{modalState.isPaused ? 'Resume attendance' : 'Clock in for today'}</span>
            <span style={edDesc}>
              {modalState.isPaused 
                ? 'Your day will be resumed along with the timer' 
                : 'Your day will be marked started'}
            </span>
          </span>
          <Checkbox checked={optAction} />
        </label>
      </div>

      <div style={{ padding: "16px 22px 18px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button onClick={handleCancel} style={{ height: 38, borderRadius: 8, fontWeight: 600, padding: "0 18px" }}>
          Cancel
        </Button>
        <Button type="primary" loading={loading} onClick={handleContinue} style={{ height: 38, borderRadius: 8, fontWeight: 600, padding: "0 18px" }}>
          Continue
        </Button>
      </div>
    </Modal>
  );

  return { withAttendanceGuard, AttendanceGuardModal };
}
