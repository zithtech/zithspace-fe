import MainLayout from "@/components/layout/MainLayout";
import VendorForm from "../../components/VendorForm";

export default function EditVendorPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <MainLayout>
      <VendorForm id={id} mode="edit" />
    </MainLayout>
  );
}
