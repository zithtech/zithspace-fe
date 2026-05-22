"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ClientPortalAuthProvider } from "@/context/ClientPortalAuthContext";
import { PortalSocketProvider } from "@/providers/PortalSocketProvider";
import PortalShell from "./_components/PortalShell";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/portal/login";

  useEffect(() => {
    const prev = document.title;
    document.title = "Zukvo · Client Portal";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <ClientPortalAuthProvider>
      <PortalSocketProvider>
        {isAuthPage ? <>{children}</> : <PortalShell>{children}</PortalShell>}
      </PortalSocketProvider>
    </ClientPortalAuthProvider>
  );
}
