"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Spin } from "antd";

export default function TimeTrackingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/time-tracking/my");
  }, [router]);

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Redirecting..." />
      </div>
    </MainLayout>
  );
}

