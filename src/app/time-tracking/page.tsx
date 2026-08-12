"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";

export default function TimeTrackingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/time-tracking/my");
  }, [router]);

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ padding: 100, textAlign: 'center' }}>
          <ZukvoLoader size="lg" message="Redirecting" />
        </div>
      </div>
    </MainLayout>
  );
}

