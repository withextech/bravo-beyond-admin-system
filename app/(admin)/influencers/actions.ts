"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type InfluencerPayload = {
  name: string;
  slug: string;
  category: string;
  short_bio: string;
  full_bio: string;
  profile_image_url: string;
  email_address: string;
  instagram_username: string;
  instagram_url: string;
  tiktok_username: string;
  tiktok_url: string;
  facebook_name: string;
  facebook_url: string;
  youtube_channel_name: string;
  youtube_url: string;
  featured_tiktok_video_url_1: string;
  featured_tiktok_video_url_2: string;
  featured_tiktok_video_url_3: string;
  sort_order: number;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  published_at: string | null;
  updated_at: string;
};

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeStatus(value: string): InfluencerPayload["status"] {
  if (value === "published" || value === "archived") {
    return value;
  }

  return "draft";
}

function getReturnPath(formData: FormData) {
  const returnPath = clean(formData.get("return_path"));
  return returnPath === "/cms/influencers" ? returnPath : "/influencers";
}

function redirectWithStatus(formData: FormData, status: string): never {
  redirect(`${getReturnPath(formData)}?status=${encodeURIComponent(status)}`);
}

function getNiches(formData: FormData) {
  return formData
    .getAll("niche")
    .map((value) => clean(value))
    .filter(Boolean)
    .slice(0, 2);
}

function buildInfluencerPayload(formData: FormData): InfluencerPayload {
  const name = clean(formData.get("name"));
  const slug = createSlug(name);
  const status = normalizeStatus(clean(formData.get("status")));
  const fullBio = clean(formData.get("full_bio"));

  return {
    name,
    slug,
    category: getNiches(formData).join(" / "),
    short_bio: fullBio,
    full_bio: fullBio,
    profile_image_url: clean(formData.get("profile_image_url")),
    email_address: clean(formData.get("email_address")),
    instagram_username: clean(formData.get("instagram_username")),
    instagram_url: clean(formData.get("instagram_url")),
    tiktok_username: clean(formData.get("tiktok_username")),
    tiktok_url: clean(formData.get("tiktok_url")),
    facebook_name: clean(formData.get("facebook_name")),
    facebook_url: clean(formData.get("facebook_url")),
    youtube_channel_name: clean(formData.get("youtube_channel_name")),
    youtube_url: clean(formData.get("youtube_url")),
    featured_tiktok_video_url_1: clean(formData.get("featured_tiktok_video_url_1")),
    featured_tiktok_video_url_2: clean(formData.get("featured_tiktok_video_url_2")),
    featured_tiktok_video_url_3: clean(formData.get("featured_tiktok_video_url_3")),
    sort_order: Number.parseInt(clean(formData.get("sort_order")) || "0", 10) || 0,
    status,
    is_featured: clean(formData.get("is_featured")) === "on",
    published_at: status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };
}

function validateInfluencer(formData: FormData, payload: InfluencerPayload) {
  if (!payload.name || !payload.slug || !payload.category) {
    redirectWithStatus(formData, "missing-fields");
  }
}

export async function createInfluencerProfile(formData: FormData) {
  const payload = buildInfluencerPayload(formData);
  validateInfluencer(formData, payload);

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("influencer_profiles").insert(payload);

  if (error) {
    redirectWithStatus(formData, error.message.includes("featured_tiktok") ? "schema-update-required" : "create-failed");
  }

  revalidatePath("/influencers");
  revalidatePath("/cms/influencers");
  redirectWithStatus(formData, "profile-created");
}

export async function updateInfluencerProfile(formData: FormData) {
  const id = clean(formData.get("id"));
  const payload = buildInfluencerPayload(formData);
  validateInfluencer(formData, payload);

  if (!id) {
    redirectWithStatus(formData, "missing-fields");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("influencer_profiles").update(payload).eq("id", id);

  if (error) {
    redirectWithStatus(formData, error.message.includes("featured_tiktok") ? "schema-update-required" : "update-failed");
  }

  revalidatePath("/influencers");
  revalidatePath("/cms/influencers");
  redirectWithStatus(formData, "profile-updated");
}

export async function deleteInfluencerProfile(formData: FormData) {
  const id = clean(formData.get("id"));

  if (!id) {
    redirectWithStatus(formData, "missing-fields");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("influencer_profiles").delete().eq("id", id);

  if (error) {
    redirectWithStatus(formData, "delete-failed");
  }

  revalidatePath("/influencers");
  revalidatePath("/cms/influencers");
  redirectWithStatus(formData, "profile-deleted");
}

export async function updateInfluencerOrder(formData: FormData) {
  const ids = JSON.parse(clean(formData.get("ids")) || "[]") as string[];

  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false };
  }

  const admin = createSupabaseAdminClient();

  for (const [index, id] of ids.entries()) {
    await admin
      .from("influencer_profiles")
      .update({ sort_order: index + 1, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  revalidatePath("/influencers");
  revalidatePath("/cms/influencers");

  return { ok: true };
}
