import { CmsModulePage } from "@/components/CmsModulePage";

export default function ShowcasesCmsPage() {
  return (
    <CmsModulePage
      eyebrow="CMS Module"
      title="Portfolio / Campaign Showcases"
      description="Manage public portfolio content only. This is not campaign monitoring or analytics."
      fields={["Title", "Slug", "Brand name", "Summary", "Cover media", "Campaign type", "Featured", "Sort order", "Status"]}
    />
  );
}
