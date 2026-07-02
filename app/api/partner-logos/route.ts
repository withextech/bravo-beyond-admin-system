import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MEDIA_BUCKET = "media-assets";
const MAX_LOGO_SIZE = 40 * 1024 * 1024;

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return data.user;
}

async function ensureMediaBucket() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.storage.getBucket(MEDIA_BUCKET);

  if (!data) {
    await admin.storage.createBucket(MEDIA_BUCKET, { public: true });
  }
}

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "session-expired" }, { status: 401 });
  }

  const formData = await request.formData();
  const brandName = clean(formData.get("brand_name"));
  const logoId = clean(formData.get("logo_id"));
  const sortOrder = Number.parseInt(clean(formData.get("sort_order")) || "0", 10) || 0;
  const file = formData.get("logo_file");

  if (!brandName || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "invalid-logo" }, { status: 400 });
  }

  if (file.size > MAX_LOGO_SIZE) {
    return NextResponse.json({ error: "file-too-large" }, { status: 400 });
  }

  await ensureMediaBucket();

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
    return NextResponse.json({ error: "upload-failed" }, { status: 500 });
  }

  const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  const { data: asset, error: assetError } = await admin
    .from("media_assets")
    .insert({
      file_name: file.name,
      file_type: file.type,
      storage_path: storagePath,
      public_url: data.publicUrl,
      alt_text: `${brandName} logo`
    })
    .select("id,file_name,file_type,public_url,alt_text,caption")
    .single();

  if (assetError || !asset?.id) {
    return NextResponse.json({ error: "record-failed" }, { status: 500 });
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

  let logoError = null;
  let savedLogo = null;

  if (logoId) {
    const result = await admin
      .from("client_logos")
      .update(payload)
      .eq("id", logoId)
      .select("id,brand_name,logo_media_id,sort_order,status")
      .single();
    logoError = result.error;
    savedLogo = result.data;
  } else {
    const { data: existing } = await admin
      .from("client_logos")
      .select("id")
      .ilike("brand_name", brandName)
      .neq("status", "archived")
      .maybeSingle();

    const result = existing?.id
      ? await admin
        .from("client_logos")
        .update(payload)
        .eq("id", existing.id)
        .select("id,brand_name,logo_media_id,sort_order,status")
        .single()
      : await admin
        .from("client_logos")
        .insert(payload)
        .select("id,brand_name,logo_media_id,sort_order,status")
        .single();

    logoError = result.error;
    savedLogo = result.data;
  }

  if (logoError || !savedLogo) {
    return NextResponse.json({ error: "save-failed" }, { status: 500 });
  }

  return NextResponse.json({ asset, logo: savedLogo });
}

export async function DELETE(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "session-expired" }, { status: 401 });
  }

  const { id } = await request.json() as { id?: string };

  if (!id) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("client_logos")
    .update({
      status: "archived",
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "delete-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
