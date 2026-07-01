import { CmsModulePage } from "@/components/CmsModulePage";

export default function ServicesCmsPage() {
  return (
    <CmsModulePage
      eyebrow="CMS Module"
      title="Services"
      description="Manage public service cards and detail content for Bravo & Beyond offerings."
      fields={["Title", "Slug", "Summary", "Description", "Icon or image", "Sort order", "Status"]}
    />
  );
}
