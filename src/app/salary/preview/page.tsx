"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import SalaryPreviewTable from "../../../components/salary/SalaryPreviewTable";

export default function SalaryPreviewPage() {
  return (
    <MainLayout>
      <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
        <SalaryPreviewTable />
      </div>
    </MainLayout>
  );
}
