import PublicDocumentView from "@/components/public/PublicDocumentView";

interface PublicDocumentPageProps {
    params: Promise<{ shareToken: string }>;
}

export default async function PublicDocumentPage({ params }: PublicDocumentPageProps) {
    const { shareToken } = await params;

    return <PublicDocumentView shareToken={shareToken} />;
}
