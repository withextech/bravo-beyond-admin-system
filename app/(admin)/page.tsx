import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getTableCount(tableName: "contact_inquiries" | "influencer_profiles") {
  try {
    const admin = createSupabaseAdminClient();
    let query = admin
      .from(tableName)
      .select("id", { count: "exact", head: true });

    if (tableName === "contact_inquiries") {
      query = query.eq("status", "new");
    }

    const { count, error } = await query;

    if (error) {
      return 0;
    }

    return count || 0;
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const [inquiryCount, influencerCount] = await Promise.all([
    getTableCount("contact_inquiries"),
    getTableCount("influencer_profiles")
  ]);

  const cards = [
    { label: "New Inquiries", value: inquiryCount, href: "/inquiries" },
    { label: "Influencers", value: influencerCount, href: "/influencers" }
  ];

  return (
    <section className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.href} href={card.href} className="dashboard-summary-card">
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </Link>
      ))}
    </section>
  );
}
