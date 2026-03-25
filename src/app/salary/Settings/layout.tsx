"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";

export default function SalarySettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      <div style={{ paddingTop: 16 }}>
        {children}
      </div>
    </MainLayout>
  );
}
