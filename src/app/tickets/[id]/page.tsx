import TicketDetails from '@/components/projects/TicketDetails';
import MainLayout from '@/components/layout/MainLayout';

interface TicketDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailsPage({ params }: TicketDetailsPageProps) {
  const { id } = await params;

  return (
    <MainLayout>
      <TicketDetails ticketId={id} />
    </MainLayout>
  );
}
