"use client";

import MainLayout from "@/components/layout/MainLayout";
import PartnerForm from "../components/PartnerForm";

export default function CreatePartnerPage() {
  return (
    <MainLayout>
      <PartnerForm mode="create" />
    </MainLayout>
  );
}
