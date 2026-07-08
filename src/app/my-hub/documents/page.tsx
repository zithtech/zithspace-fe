"use client";
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import MyHubContent from "@/components/my-hub/MyHubContent";
import MyDocumentsPanel from "@/components/my-hub/MyDocumentsPanel";

export default function MyHubDocumentsPage() {
  return (
    <MainLayout>
      <MyHubContent>
        <MyDocumentsPanel />
      </MyHubContent>
    </MainLayout>
  );
}
