"use client";

import { useEffect } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { useAuth } from "@/context/AuthContext";
import { App } from "antd";

export const TimerSocketListener = () => {
  const { socket } = useSocket();
  const { syncTimer } = useTimeTrackerStore();
  const { user } = useAuth();
  const { message } = App.useApp();

  useEffect(() => {
    if (!socket) return;

    const onAutoPaused = (data: any) => {
      if (data.entry) {
        syncTimer(data.entry);
        message.warning({
          content: `Timer for "${data.entry.taskName || "Untitled Task"}" paused automatically (6h limit)`,
          duration: 5,
          key: "timer-auto-pause",
        });
      }
    };

    // Attendance break ↔ timer: the day was paused, so the work timer was
    // paused too. Only the affected user's client should mutate its store.
    const onAttendancePaused = (data: any) => {
      if (!data?.entries?.length || (user?.id && data.userId !== user.id)) return;
      data.entries.forEach((entry: any) => syncTimer(entry));
      message.info({
        content: "Timer paused with your break",
        duration: 3,
        key: "timer-attendance",
      });
    };

    const onAttendanceResumed = (data: any) => {
      if (!data?.entries?.length || (user?.id && data.userId !== user.id)) return;
      data.entries.forEach((entry: any) => syncTimer(entry));
      message.success({
        content: "Timer resumed — welcome back",
        duration: 3,
        key: "timer-attendance",
      });
    };

    // Day completed → timers were stopped/finalized (syncTimer removes STOPPED).
    const onAttendanceStopped = (data: any) => {
      if (!data?.entries?.length || (user?.id && data.userId !== user.id)) return;
      data.entries.forEach((entry: any) => syncTimer(entry));
      message.info({
        content: "Timer stopped — day complete",
        duration: 3,
        key: "timer-attendance",
      });
    };

    socket.on("TIMER_AUTO_PAUSED", onAutoPaused);
    socket.on("TIMER_ATTENDANCE_PAUSED", onAttendancePaused);
    socket.on("TIMER_ATTENDANCE_RESUMED", onAttendanceResumed);
    socket.on("TIMER_ATTENDANCE_STOPPED", onAttendanceStopped);

    return () => {
      socket.off("TIMER_AUTO_PAUSED", onAutoPaused);
      socket.off("TIMER_ATTENDANCE_PAUSED", onAttendancePaused);
      socket.off("TIMER_ATTENDANCE_RESUMED", onAttendanceResumed);
      socket.off("TIMER_ATTENDANCE_STOPPED", onAttendanceStopped);
    };
  }, [socket, syncTimer, message, user?.id]);

  return null;
};
