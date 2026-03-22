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
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" tip="Redirecting">
            <div style={{ padding: 20 }} />
          </Spin>
        </div>
      </div>
    </MainLayout>
  );
}

