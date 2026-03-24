"use client";

import MainLayout from "@/components/layout/MainLayout";
import PartnerForm from "../components/PartnerForm";
import { App } from "antd";

export default function CreatePartnerPage() {
  return (
    <MainLayout>
      <App>
        <PartnerForm mode="create" />
      </App>
    </MainLayout>
  );
}
