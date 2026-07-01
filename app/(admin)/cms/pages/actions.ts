"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ContentStatus = "draft" | "published" | "archived";

const MEDIA_BUCKET = "media-assets";
const MAX_FILE_SIZE = 40 * 1024 * 1024;

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function normalizeStatus(value: string): ContentStatus {
  if (value === "published" || value === "archived") {
    return value;
  }

  return "draft";
}

function redirectWithStatus(status: string, pageKey?: string): never {
  const suffix = pageKey ? `&page=${encodeURIComponent(pageKey)}` : "";
  redirect(`/cms/pages?status=${encodeURIComponent(status)}${suffix}`);
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uploadSectionMedia(formData: FormData, pageKey: string, sectionKey: string) {
  const file = formData.get("media_file");

  if (!(file instanceof File) || file.size === 0) {
    return clean(formData.get("media_asset_id")) || null;
  }

  if (pageKey === "home" && sectionKey === "hero" && !file.type.startsWith("video/")) {
    redirectWithStatus("invalid-video", pageKey);
  }

  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    redirectWithStatus("invalid-file", pageKey);
  }

  if (file.size > MAX_FILE_SIZE) {
    redirectWithStatus("file-too-large", pageKey);
  }

  const admin = createSupabaseAdminClient();
  const fileName = sanitizeFileName(file.name) || "section-media";
  const storagePath = `portfolio/${pageKey}/${sectionKey}-${Date.now()}-${crypto.randomUUID()}-${fileName}`;
  const { error: uploadError } = await admin.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    redirectWithStatus("upload-failed", pageKey);
  }

  const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  const { data: asset, error: insertError } = await admin
    .from("media_assets")
    .insert({
      file_name: file.name,
      file_type: file.type,
      storage_path: storagePath,
      public_url: data.publicUrl,
      alt_text: clean(formData.get("media_alt_text")) || clean(formData.get("title")) || null,
      caption: clean(formData.get("media_caption")) || null
    })
    .select("id")
    .single();

  if (insertError || !asset?.id) {
    redirectWithStatus("record-failed", pageKey);
  }

  return asset.id as string;
}

export async function savePageSection(formData: FormData) {
  const pageKey = clean(formData.get("page_key"));
  const sectionKey = clean(formData.get("section_key"));
  const status = normalizeStatus(clean(formData.get("status")));

  if (!pageKey || !sectionKey) {
    redirectWithStatus("missing-fields", pageKey);
  }

  const mediaAssetId = await uploadSectionMedia(formData, pageKey, sectionKey);
  const payload = {
    page_key: pageKey,
    section_key: sectionKey,
    title: clean(formData.get("title")) || null,
    subtitle: clean(formData.get("subtitle")) || null,
    body: clean(formData.get("body")) || null,
    cta_label: clean(formData.get("cta_label")) || null,
    cta_url: clean(formData.get("cta_url")) || null,
    media_asset_id: mediaAssetId || null,
    sort_order: Number.parseInt(clean(formData.get("sort_order")) || "0", 10) || 0,
    status,
    published_at: status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("page_sections")
    .upsert(payload, { onConflict: "page_key,section_key" });

  if (error) {
    redirectWithStatus("save-failed", pageKey);
  }

  revalidatePath("/cms/pages");
  redirectWithStatus("section-saved", pageKey);
}

export async function archivePageSection(formData: FormData) {
  const pageKey = clean(formData.get("page_key"));
  const sectionKey = clean(formData.get("section_key"));

  if (!pageKey || !sectionKey) {
    redirectWithStatus("missing-fields", pageKey);
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("page_sections")
    .update({
      status: "archived",
      published_at: null,
      updated_at: new Date().toISOString()
    })
    .eq("page_key", pageKey)
    .eq("section_key", sectionKey);

  if (error) {
    redirectWithStatus("archive-failed", pageKey);
  }

  revalidatePath("/cms/pages");
  redirectWithStatus("section-archived", pageKey);
}

export async function uploadPartnerLogo(formData: FormData) {
  const brandName = clean(formData.get("brand_name"));
  const logoId = clean(formData.get("logo_id"));
  const sortOrder = Number.parseInt(clean(formData.get("sort_order")) || "0", 10) || 0;
  const file = formData.get("logo_file");

  if (!brandName) {
    redirectWithStatus("missing-fields", "home");
  }

  if (!(file instanceof File) || file.size === 0) {
    redirectWithStatus("missing-file", "home");
  }

  if (!file.type.startsWith("image/")) {
    redirectWithStatus("invalid-logo", "home");
  }

  if (file.size > MAX_FILE_SIZE) {
    redirectWithStatus("file-too-large", "home");
  }

  const admin = createSupabaseAdminClient();
  const fileName = sanitizeFileName(file.name) || "partner-logo";
  const storagePath = `portfolio/partner-logos/${Date.now()}-${crypto.randomUUID()}-${fileName}`;
  const { error: uploadError } = await admin.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    redirectWithStatus("upload-failed", "home");
  }

  const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  const { data: asset, error: insertError } = await admin
    .from("media_assets")
    .insert({
      file_name: file.name,
      file_type: file.type,
      storage_path: storagePath,
      public_url: data.publicUrl,
      alt_text: `${brandName} logo`
    })
    .select("id")
    .single();

  if (insertError || !asset?.id) {
    redirectWithStatus("record-failed", "home");
  }

  const payload = {
    brand_name: brandName,
    logo_media_id: asset.id as string,
    is_featured: true,
    sort_order: sortOrder,
    status: "published" as const,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = logoId
    ? await admin.from("client_logos").update(payload).eq("id", logoId)
    : await admin.from("client_logos").insert(payload);

  if (error) {
    redirectWithStatus("save-failed", "home");
  }

  revalidatePath("/cms/pages");
  redirectWithStatus("logo-saved", "home");
}

export async function deletePartnerLogo(formData: FormData) {
  const logoId = clean(formData.get("logo_id"));

  if (!logoId) {
    redirectWithStatus("missing-fields", "home");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("client_logos")
    .update({
      status: "archived",
      updated_at: new Date().toISOString()
    })
    .eq("id", logoId);

  if (error) {
    redirectWithStatus("delete-failed", "home");
  }

  revalidatePath("/cms/pages");
  redirectWithStatus("logo-deleted", "home");
}
