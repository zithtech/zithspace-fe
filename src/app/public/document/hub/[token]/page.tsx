import PublicHubView from "@/components/public/PublicHubView";

interface PublicHubPageProps {
    params: Promise<{ token: string }>;
}

export default async function PublicHubPage({ params }: PublicHubPageProps) {
    const { token } = await params;

    return <PublicHubView shareToken={token} />;
}
