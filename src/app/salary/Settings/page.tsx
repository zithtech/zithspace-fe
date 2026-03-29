"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/salary/Settings/company");
  }, [router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
      <Spin tip="Redirecting to Company Settings..." size="large" />
    </div>
  );
}
