import { WebsitePageEditor, type ClientLogo, type MediaAsset, type PageBlueprint, type PageSectionRecord } from "@/components/WebsitePageEditor";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const pageBlueprints: PageBlueprint[] = [
  {
    key: "home",
    label: "Home",
    route: "/",
    purpose: "Landing page content for the first portfolio impression.",
    sections: [
      { section_key: "hero", label: "Hero video", hint: "Top visual and campaign promise", sort_order: 1 },
      { section_key: "intro", label: "What We Build", hint: "Intro image, counter, and positioning copy", sort_order: 2 },
      { section_key: "trusted", label: "Partner Brands & Agencies", hint: "Brand and agency logo list", sort_order: 3 },
      { section_key: "help", label: "How We Help", hint: "Service teaser and CTA buttons", sort_order: 4 },
      { section_key: "campaigns", label: "Campaign highlights", hint: "Recent campaign showcase headline", sort_order: 5 },
      { section_key: "contact", label: "Campaign inquiry CTA", hint: "Homepage inquiry form intro", sort_order: 6 }
    ]
  },
  {
    key: "about",
    label: "About Us",
    route: "/about",
    purpose: "Agency story, values, mission, vision, and campaign CTA.",
    sections: [
      { section_key: "hero", label: "Page hero", hint: "About page headline and summary", sort_order: 1 },
      { section_key: "story", label: "Our Story", hint: "Editorial story copy and image", sort_order: 2 },
      { section_key: "values", label: "Core Values", hint: "Values section headline and intro", sort_order: 3 },
      { section_key: "mission", label: "Mission", hint: "Mission panel copy", sort_order: 4 },
      { section_key: "vision", label: "Vision", hint: "Vision panel copy", sort_order: 5 },
      { section_key: "cta", label: "Page CTA", hint: "Bottom campaign prompt", sort_order: 6 }
    ]
  },
  {
    key: "services",
    label: "Services",
    route: "/services",
    purpose: "Services positioning and operating model for creator-led campaigns.",
    sections: [
      { section_key: "hero", label: "Page hero", hint: "Services page headline and intro", sort_order: 1 },
      { section_key: "how-we-work", label: "How We Work", hint: "Service grid intro", sort_order: 2 },
      { section_key: "cta", label: "Page CTA", hint: "Campaign objective prompt", sort_order: 3 }
    ]
  },
  {
    key: "influencers",
    label: "Influencers",
    route: "/influencers",
    purpose: "Creator directory intro, filters, and inquiry handoff.",
    sections: [
      { section_key: "directory", label: "Directory header", hint: "Search and directory headline", sort_order: 1 },
      { section_key: "filters", label: "Niche filters", hint: "Filter copy and category context", sort_order: 2 },
      { section_key: "cta", label: "Page CTA", hint: "Lineup request prompt", sort_order: 3 }
    ]
  },
  {
    key: "contact",
    label: "Contact Us",
    route: "/contact",
    purpose: "Inquiry page content, contact details, and form intro.",
    sections: [
      { section_key: "hero", label: "Page hero", hint: "Contact page headline and summary", sort_order: 1 },
      { section_key: "contact-info", label: "Contact info", hint: "Phone, email, address, and intro", sort_order: 2 },
      { section_key: "form", label: "Inquiry form", hint: "Form heading and helper copy", sort_order: 3 }
    ]
  }
];

const statusMessages: Record<string, string> = {
  "missing-fields": "Page and section keys are required.",
  "missing-file": "Choose a file before uploading.",
  "invalid-video": "Hero video only accepts video files.",
  "invalid-logo": "Partner logos must be image files.",
  "save-failed": "Section could not be saved. Check the Supabase CMS schema.",
  "archive-failed": "Section could not be archived.",
  "section-saved": "Section saved.",
  "section-archived": "Section archived.",
  "logo-saved": "Logo saved.",
  "logo-deleted": "Logo deleted.",
  "delete-failed": "Logo could not be deleted."
};

function getStatusTone(status?: string) {
  if (!status) {
    return "";
  }

  return status.includes("failed") || status.includes("missing")
    || status.includes("invalid")
    || status.includes("large")
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default async function PagesCmsPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params?.status;
  const initialPageKey = pageBlueprints.some((page) => page.key === params?.page) ? params?.page || "home" : "home";
  let setupMissing = false;
  let sections: PageSectionRecord[] = [];
  let mediaAssets: MediaAsset[] = [];
  let clientLogos: ClientLogo[] = [];

  try {
    const admin = createSupabaseAdminClient();
    const [sectionsResult, mediaResult, logosResult] = await Promise.all([
      admin
        .from("page_sections")
        .select("id,page_key,section_key,title,subtitle,body,cta_label,cta_url,media_asset_id,sort_order,status")
        .order("page_key", { ascending: true })
        .order("sort_order", { ascending: true }),
      admin
        .from("media_assets")
        .select("id,file_name,file_type,public_url,alt_text,caption")
        .order("created_at", { ascending: false })
        .limit(80),
      admin
        .from("client_logos")
        .select("id,brand_name,logo_media_id,sort_order,status")
        .neq("status", "archived")
        .order("sort_order", { ascending: true })
        .order("brand_name", { ascending: true })
    ]);

    if (sectionsResult.error || mediaResult.error || logosResult.error) {
      throw sectionsResult.error || mediaResult.error || logosResult.error;
    }

    sections = (sectionsResult.data || []) as PageSectionRecord[];
    mediaAssets = (mediaResult.data || []) as MediaAsset[];
    clientLogos = (logosResult.data || []) as ClientLogo[];
  } catch {
    setupMissing = true;
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-panel">
        <h1 className="text-4xl font-black text-slate-950">Website Content Management</h1>
      </div>

      {status ? (
        <div className={`rounded-xl border px-4 py-3 text-sm font-black ${getStatusTone(status)}`}>
          {statusMessages[status] || "Action completed."}
        </div>
      ) : null}

      {setupMissing ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800">
          Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local`, then run `supabase/schema.sql` and `supabase/media-storage-setup.sql` to manage website page sections and media uploads.
        </div>
      ) : null}

      <WebsitePageEditor
        initialPageKey={initialPageKey}
        clientLogos={clientLogos}
        mediaAssets={mediaAssets}
        pages={pageBlueprints}
        sections={sections}
        setupMissing={setupMissing}
      />
    </section>
  );
}
