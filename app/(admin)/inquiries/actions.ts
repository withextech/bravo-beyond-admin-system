"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type InquiryStatus = "new" | "read" | "replied" | "archived";

export async function updateInquiryStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as InquiryStatus;
  const allowedStatuses: InquiryStatus[] = ["new", "read", "replied", "archived"];

  if (!id || !allowedStatuses.includes(status)) {
    return;
  }

  const admin = createSupabaseAdminClient();
  await admin
    .from("contact_inquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/inquiries");
}
