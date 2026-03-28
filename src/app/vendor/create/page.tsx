import MainLayout from "@/components/layout/MainLayout";
import VendorForm from "../components/VendorForm";

export default function CreateVendorPage() {
  return (
    <MainLayout>
      <VendorForm mode="create" />
    </MainLayout>
  );
}
