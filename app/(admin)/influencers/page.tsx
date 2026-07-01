import { InfluencersModulePage } from "@/components/InfluencersModulePage";

type InfluencersPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function InfluencersPage({ searchParams }: InfluencersPageProps) {
  const params = await searchParams;

  return <InfluencersModulePage returnPath="/influencers" showCmsTabs={false} status={params.status} />;
}
