"use client";

import { useEffect } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { App } from "antd";

export const TimerSocketListener = () => {
  const { socket } = useSocket();
  const { syncTimer } = useTimeTrackerStore();
  const { message } = App.useApp();

  useEffect(() => {
    if (!socket) return;

    socket.on("TIMER_AUTO_PAUSED", (data: any) => {
      console.log("[Socket] Timer auto-paused event received:", data);
      
      if (data.entry) {
        syncTimer(data.entry);
        message.warning({
          content: `Timer for "${data.entry.taskName || 'Untitled Task'}" paused automatically (6h limit)`,
          duration: 5,
          key: 'timer-auto-pause'
        });
      }
    });

    return () => {
      socket.off("TIMER_AUTO_PAUSED");
    };
  }, [socket, syncTimer, message]);

  return null;
};
