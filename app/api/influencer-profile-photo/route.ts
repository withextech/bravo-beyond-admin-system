import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const INFLUENCER_MEDIA_BUCKET = "media-assets";
const MAX_PROFILE_PHOTO_SIZE = 50 * 1024 * 1024;

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureMediaBucket() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.storage.getBucket(INFLUENCER_MEDIA_BUCKET);

  if (data) {
    return;
  }

  await admin.storage.createBucket(INFLUENCER_MEDIA_BUCKET, {
    public: true
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.auth.getUser();

  if (!current.user) {
    return NextResponse.json({ error: "session-expired" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const name = String(formData.get("name") || "profile").trim();

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "missing-file" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "invalid-file" }, { status: 400 });
  }

  if (file.size > MAX_PROFILE_PHOTO_SIZE) {
    return NextResponse.json({ error: "file-too-large" }, { status: 400 });
  }

  await ensureMediaBucket();

  const admin = createSupabaseAdminClient();
  const fileName = sanitizeFileName(file.name) || "profile-photo";
  const nameSlug = sanitizeFileName(name).replace(/\.[a-z0-9]+$/, "") || "profile";
  const storagePath = `influencers/${nameSlug}-${crypto.randomUUID()}-${fileName}`;
  const { error } = await admin.storage
    .from(INFLUENCER_MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) {
    return NextResponse.json({ error: "upload-failed" }, { status: 500 });
  }

  const { data } = admin.storage.from(INFLUENCER_MEDIA_BUCKET).getPublicUrl(storagePath);
  const publicUrl = data.publicUrl;

  await admin.from("media_assets").insert({
    file_name: file.name,
    file_type: file.type,
    storage_path: storagePath,
    public_url: publicUrl,
    alt_text: name
  });

  return NextResponse.json({ url: publicUrl });
}
