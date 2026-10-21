"use client";

import React from "react";
import Organization from "@/components/organaization/Organization";

export default function OrganizationTab({
  dashboardSettings,
}: {
  dashboardSettings?: any;
}) {
  return <Organization dashboardSettings={dashboardSettings} />;
}
