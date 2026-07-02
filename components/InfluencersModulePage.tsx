import { CmsTabs } from "@/components/CmsTabs";
import { InfluencersClientPage, type InfluencerProfile } from "@/components/InfluencersClientPage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type InfluencersModulePageProps = {
  showCmsTabs?: boolean;
  returnPath?: "/influencers" | "/cms/influencers";
  status?: string;
};

const emptyInfluencer: InfluencerProfile = {
  id: "",
  name: "",
  category: "",
  full_bio: "",
  date_joined: "",
  profile_image_url: "",
  email_address: "",
  instagram_username: "",
  instagram_url: "",
  tiktok_username: "",
  tiktok_url: "",
  facebook_name: "",
  facebook_url: "",
  youtube_channel_name: "",
  youtube_url: "",
  featured_tiktok_video_url_1: "",
  featured_tiktok_video_url_2: "",
  featured_tiktok_video_url_3: "",
  sort_order: 0,
  status: "draft",
  is_featured: false
};

const statusMessages: Record<string, string> = {
  "missing-fields": "Complete the required name and niche fields.",
  "schema-update-required": "Influencer fields are not enabled in Supabase yet. Run supabase/influencer-profiles-update.sql in the Supabase SQL Editor.",
  "upload-failed": "Profile photo could not be uploaded. Check that the media-assets storage bucket exists and is public.",
  "invalid-file": "Profile photo must be an image file.",
  "file-too-large": "Profile photo must be 50 MB or smaller.",
  "create-failed": "Influencer profile could not be created.",
  "update-failed": "Influencer profile could not be updated.",
  "delete-failed": "Influencer profile could not be deleted.",
  "profile-created": "Influencer profile created.",
  "profile-updated": "Influencer profile updated.",
  "profile-deleted": "Influencer profile deleted."
};

function isMissingSupabaseConfigError(error: unknown) {
  return error instanceof Error && error.message.includes("Missing Supabase admin environment variables");
}

function getStatusTone(status?: string) {
  if (!status) {
    return "";
  }

  return status.includes("failed") || status.includes("missing") || status.includes("required")
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function normalizeInfluencer(profile: Partial<InfluencerProfile> & { created_at?: string }): InfluencerProfile {
  const fallbackDateJoined = profile.created_at ? profile.created_at.slice(0, 10) : "";

  return {
    ...emptyInfluencer,
    ...profile,
    id: profile.id || "",
    name: profile.name || "",
    category: profile.category || "",
    full_bio: profile.full_bio || "",
    date_joined: profile.date_joined || fallbackDateJoined,
    profile_image_url: profile.profile_image_url || "",
    email_address: profile.email_address || "",
    instagram_username: profile.instagram_username || "",
    instagram_url: profile.instagram_url || "",
    tiktok_username: profile.tiktok_username || "",
    tiktok_url: profile.tiktok_url || "",
    facebook_name: profile.facebook_name || "",
    facebook_url: profile.facebook_url || "",
    youtube_channel_name: profile.youtube_channel_name || "",
    youtube_url: profile.youtube_url || "",
    featured_tiktok_video_url_1: profile.featured_tiktok_video_url_1 || "",
    featured_tiktok_video_url_2: profile.featured_tiktok_video_url_2 || "",
    featured_tiktok_video_url_3: profile.featured_tiktok_video_url_3 || "",
    sort_order: profile.sort_order || 0,
    status: profile.status || "draft",
    is_featured: profile.is_featured || false
  };
}

export async function InfluencersModulePage({
  showCmsTabs = true,
  returnPath = showCmsTabs ? "/cms/influencers" : "/influencers",
  status
}: InfluencersModulePageProps) {
  let setupMissing = false;
  let schemaUpdateRequired = false;
  let dataLoadFailed = false;
  let influencers: InfluencerProfile[] = [];

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("influencer_profiles")
      .select(`
        id,
        name,
        category,
        full_bio,
        created_at,
        profile_image_url,
        email_address,
        instagram_username,
        instagram_url,
        tiktok_username,
        tiktok_url,
        facebook_name,
        facebook_url,
        youtube_channel_name,
        youtube_url,
        featured_tiktok_video_url_1,
        featured_tiktok_video_url_2,
        featured_tiktok_video_url_3,
        sort_order,
        status,
        is_featured
      `)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      if (error.message.includes("featured_tiktok") || error.message.includes("profile_image_url")) {
        schemaUpdateRequired = true;
      } else {
        throw error;
      }
    }

    influencers = (data || []).map((profile) => normalizeInfluencer(profile as Partial<InfluencerProfile>));
  } catch (error) {
    if (isMissingSupabaseConfigError(error)) {
      setupMissing = true;
    } else {
      dataLoadFailed = true;
      console.error("Influencer profiles could not be loaded.", error);
    }
  }

  return (
    <section className="grid gap-6">
      {showCmsTabs ? <CmsTabs /> : null}

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-panel lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-950">Influencers</h1>
        </div>
        <span className="self-start rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-adminBlue lg:self-auto">
          {influencers.length} profiles
        </span>
      </div>

      {status ? (
        <div className={`rounded-xl border px-4 py-3 text-sm font-black ${getStatusTone(status)}`}>
          {statusMessages[status] || "Action completed."}
        </div>
      ) : null}

      {setupMissing ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800">
          Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the project environment variables to manage influencer profiles.
        </div>
      ) : null}

      {dataLoadFailed ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800">
          Influencer profiles could not be loaded. Check the Supabase schema and Vercel function logs for the exact database error.
        </div>
      ) : null}

      {schemaUpdateRequired ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800">
          Run `supabase/influencer-profiles-update.sql` in the Supabase SQL Editor to enable email, profile photo, social username, and featured TikTok video fields.
        </div>
      ) : null}

      <InfluencersClientPage
        influencers={influencers}
        returnPath={returnPath}
        dataLoadFailed={dataLoadFailed}
        schemaUpdateRequired={schemaUpdateRequired}
        setupMissing={setupMissing}
      />
    </section>
  );
}
