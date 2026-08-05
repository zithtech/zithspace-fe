import MainLayout from "@/components/layout/MainLayout";
import TestScopeView from "./TestScopeView";

interface TestScopePageProps {
  params: Promise<{ id: string }>;
}

export default async function TestScopePage({ params }: TestScopePageProps) {
  const { id } = await params;

  return (
    <MainLayout noPadding>
      <TestScopeView id={id} />
    </MainLayout>
  );
}
