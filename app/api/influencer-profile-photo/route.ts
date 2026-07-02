import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const INFLUENCER_MEDIA_BUCKET = "media-assets";
const MAX_PROFILE_PHOTO_SIZE = 50 * 1024 * 1024;

type SignUploadPayload = {
  action?: "sign";
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  name?: string;
};

type CompleteUploadPayload = {
  action?: "complete";
  fileName?: string;
  fileType?: string;
  name?: string;
  publicUrl?: string;
  storagePath?: string;
};

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

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.auth.getUser();

  return current.user;
}

function validateImageInput(fileName: string, fileType: string, fileSize: number) {
  if (!fileName || fileSize <= 0) {
    return "missing-file";
  }

  if (!fileType.startsWith("image/")) {
    return "invalid-file";
  }

  if (fileSize > MAX_PROFILE_PHOTO_SIZE) {
    return "file-too-large";
  }

  return null;
}

async function signUpload(payload: SignUploadPayload) {
  const fileName = sanitizeFileName(payload.fileName || "") || "profile-photo";
  const fileType = payload.fileType || "";
  const fileSize = Number(payload.fileSize || 0);
  const name = String(payload.name || "profile").trim();
  const validationError = validateImageInput(fileName, fileType, fileSize);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  await ensureMediaBucket();

  const admin = createSupabaseAdminClient();
  const nameSlug = sanitizeFileName(name).replace(/\.[a-z0-9]+$/, "") || "profile";
  const storagePath = `influencers/${nameSlug}-${crypto.randomUUID()}-${fileName}`;
  const { data: signedUpload, error } = await admin.storage
    .from(INFLUENCER_MEDIA_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !signedUpload) {
    console.error("Could not create signed profile photo upload URL.", error);
    return NextResponse.json({ error: "upload-failed" }, { status: 500 });
  }

  const { data } = admin.storage.from(INFLUENCER_MEDIA_BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({
    publicUrl: data.publicUrl,
    storagePath: signedUpload.path,
    token: signedUpload.token
  });
}

async function completeUpload(payload: CompleteUploadPayload) {
  const storagePath = payload.storagePath || "";
  const publicUrl = payload.publicUrl || "";
  const fileName = payload.fileName || "profile-photo";
  const fileType = payload.fileType || "image/*";
  const name = String(payload.name || "profile").trim();

  if (!storagePath || !publicUrl || !storagePath.startsWith("influencers/")) {
    return NextResponse.json({ error: "upload-failed" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("media_assets").insert({
    file_name: fileName,
    file_type: fileType,
    storage_path: storagePath,
    public_url: publicUrl,
    alt_text: name
  });

  if (error) {
    console.error("Could not record uploaded profile photo.", error);
    return NextResponse.json({ error: "upload-failed" }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl });
}

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "session-expired" }, { status: 401 });
  }

  const payload = await request.json() as SignUploadPayload | CompleteUploadPayload;

  if (payload.action === "sign") {
    return signUpload(payload);
  }

  if (payload.action === "complete") {
    return completeUpload(payload);
  }

  return NextResponse.json({ error: "upload-failed" }, { status: 400 });
}
