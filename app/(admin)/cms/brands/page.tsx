import { CmsModulePage } from "@/components/CmsModulePage";

export default function BrandsCmsPage() {
  return (
    <CmsModulePage
      eyebrow="CMS Module"
      title="Brand / Client Logos"
      description="Manage public client logo strips and credibility sections for the portfolio website."
      fields={["Brand name", "Logo image", "Website URL", "Featured", "Sort order", "Status"]}
    />
  );
}
