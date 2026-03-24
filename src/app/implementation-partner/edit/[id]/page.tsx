"use client";

import MainLayout from "@/components/layout/MainLayout";
import PartnerForm from "../../components/PartnerForm";
import { useParams } from "next/navigation";
import { App } from "antd";

export default function EditPartnerPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <MainLayout>
      <App>
        <PartnerForm id={id} mode="edit" />
      </App>
    </MainLayout>
  );
}
