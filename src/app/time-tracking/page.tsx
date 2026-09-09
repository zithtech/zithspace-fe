"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useSubscriptionFeature } from "@/hooks/useSubscriptionFeature";

export default function TimeTrackingRedirect() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const canUseMyTime = useSubscriptionFeature("work_time_tracking_my");
  const canUseTeamTime = useSubscriptionFeature("work_time_tracking_team");

  useEffect(() => {
    if (authLoading) return;

    if (canUseMyTime) {
      router.replace("/time-tracking/my");
    } else if (canUseTeamTime) {
      router.replace("/time-tracking/team");
    } else {
      router.replace("/dashboard");
    }
  }, [authLoading, canUseMyTime, canUseTeamTime, router]);

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

