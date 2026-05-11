"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { TicketDetailDrawer } from "@/components/projects/drawer/TicketDetailDrawer";

interface TicketDrawerContextValue {
  open: (ticketId: string) => void;
  close: () => void;
}

const TicketDrawerContext = createContext<TicketDrawerContextValue | null>(null);

export function TicketDrawerProvider({ children }: { children: React.ReactNode }) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const open = useCallback((ticketId: string) => {
    if (ticketId) setSelectedTicketId(ticketId);
  }, []);

  const close = useCallback(() => setSelectedTicketId(null), []);

  return (
    <TicketDrawerContext.Provider value={{ open, close }}>
      {children}
      <TicketDetailDrawer
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onClose={close}
        onNavigate={setSelectedTicketId}
      />
    </TicketDrawerContext.Provider>
  );
}

export function useTicketDrawer() {
  const ctx = useContext(TicketDrawerContext);
  if (!ctx) {
    throw new Error("useTicketDrawer must be used within a TicketDrawerProvider");
  }
  return ctx;
}
