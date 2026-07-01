import { InfluencersModulePage } from "@/components/InfluencersModulePage";

type InfluencersCmsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function InfluencersCmsPage({ searchParams }: InfluencersCmsPageProps) {
  const params = await searchParams;

  return <InfluencersModulePage returnPath="/cms/influencers" status={params.status} />;
}
