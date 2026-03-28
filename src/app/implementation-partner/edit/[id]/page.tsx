"use client";

import MainLayout from "@/components/layout/MainLayout";
import PartnerForm from "../../components/PartnerForm";
import { useParams } from "next/navigation";

export default function EditPartnerPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <MainLayout>
      <PartnerForm id={id} mode="edit" />
    </MainLayout>
  );
}
