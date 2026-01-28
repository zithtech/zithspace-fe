"use client";

import { CustomerProvider } from "@/context/CustomerContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerProvider>{children}</CustomerProvider>;
}
