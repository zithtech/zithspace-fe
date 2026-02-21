import PublicTicketDetails from "@/components/public/PublicTicketDetails";

interface PublicTicketPageProps {
    params: Promise<{ id: string }>;
}

export default async function PublicTicketPage({ params }: PublicTicketPageProps) {
    const { id } = await params;

    return <PublicTicketDetails ticketId={id} />;
}
