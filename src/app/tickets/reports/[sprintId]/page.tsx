import MainLayout from "@/components/layout/MainLayout";
import SprintReportView from "./SprintReportView";

interface SprintReportPageProps {
  params: Promise<{ sprintId: string }>;
}

export default async function SprintReportPage({ params }: SprintReportPageProps) {
  const { sprintId } = await params;

  return (
    <MainLayout>
      <SprintReportView sprintId={sprintId} />
    </MainLayout>
  );
}
