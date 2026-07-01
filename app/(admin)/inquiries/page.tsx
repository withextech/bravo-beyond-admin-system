import { updateInquiryStatus } from "./actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type InquiryStatus = "new" | "read" | "replied" | "archived";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  inquiry_type: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
};

type InquiriesPageProps = {
  searchParams?: Promise<{ selected?: string; status?: string }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getPreview(message: string) {
  return message.length > 118 ? `${message.slice(0, 118)}...` : message;
}

async function getInquiries(status?: string) {
  try {
    const admin = createSupabaseAdminClient();
    let query = admin
      .from("contact_inquiries")
      .select("id,name,email,company,inquiry_type,message,status,created_at")
      .order("created_at", { ascending: false });

    if (status && ["new", "read", "replied", "archived"].includes(status)) {
      query = query.eq("status", status);
    } else {
      query = query.neq("status", "archived");
    }

    const { data, error } = await query;

    if (error) {
      return [];
    }

    return (data || []) as Inquiry[];
  } catch {
    return [];
  }
}

async function getUnreadCount() {
  try {
    const admin = createSupabaseAdminClient();
    const { count, error } = await admin
      .from("contact_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");

    if (error) {
      return 0;
    }

    return count || 0;
  } catch {
    return 0;
  }
}

function getInquiryHref(id: string, status?: string) {
  const params = new URLSearchParams({ selected: id });

  if (status) {
    params.set("status", status);
  }

  return `/inquiries?${params.toString()}`;
}

export default async function InquiriesPage({ searchParams }: InquiriesPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const selectedId = params?.selected;
  const [inquiries, unreadCount] = await Promise.all([getInquiries(status), getUnreadCount()]);
  const activeInquiry = inquiries.find((inquiry) => inquiry.id === selectedId) || inquiries[0];
  const filters = [
    { label: "All", href: "/inquiries", active: !status },
    { label: "Unread", href: "/inquiries?status=new", active: status === "new" },
    { label: "Read", href: "/inquiries?status=read", active: status === "read" },
    { label: "Replied", href: "/inquiries?status=replied", active: status === "replied" },
    { label: "Archived", href: "/inquiries?status=archived", active: status === "archived" }
  ];

  return (
    <section className="grid gap-5 pt-6">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-panel lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-adminBlue">Inbox</p>
          <h1 className="text-3xl font-black text-slate-950">Inquiries</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <a
              key={filter.href}
              href={filter.href}
              className={`rounded-full px-4 py-2 text-sm font-black ${
                filter.active ? "bg-adminBlue text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid min-h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="border-r border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <strong className="text-sm font-black text-slate-900">{inquiries.length} messages</strong>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-adminBlue">{unreadCount} unread</span>
          </div>

          <div className="max-h-[560px] overflow-y-auto">
            {inquiries.length ? (
              inquiries.map((inquiry) => (
                <a
                  key={inquiry.id}
                  href={getInquiryHref(inquiry.id, status)}
                  className={`block border-b border-slate-200 px-5 py-4 transition hover:bg-white ${
                    activeInquiry?.id === inquiry.id
                      ? "bg-white shadow-[inset_4px_0_0_#2563eb]"
                      : inquiry.status === "new"
                        ? "bg-white"
                        : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {inquiry.status === "new" ? <span className="h-2.5 w-2.5 rounded-full bg-adminBlue" /> : null}
                        <strong className="truncate text-sm font-black text-slate-950">{inquiry.name}</strong>
                      </div>
                      <p className="mt-1 truncate text-xs font-bold text-slate-500">{inquiry.email}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-slate-400">{formatDate(inquiry.created_at)}</span>
                  </div>
                  <p className="mt-3 text-sm font-black text-slate-800">{inquiry.inquiry_type || "General Inquiry"}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{getPreview(inquiry.message)}</p>
                </a>
              ))
            ) : (
              <div className="grid min-h-[360px] place-items-center px-6 text-center">
                <p className="text-sm font-bold text-slate-500">No inquiries found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="max-h-[620px] overflow-y-auto bg-white">
          {activeInquiry ? (
            <article id={`inquiry-${activeInquiry.id}`} className="grid gap-6 p-6">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-600">
                    {activeInquiry.status}
                  </span>
                  <h2 className="mt-4 text-2xl font-black text-slate-950">{activeInquiry.inquiry_type || "General Inquiry"}</h2>
                  <p className="mt-2 text-sm font-bold text-slate-500">{formatDate(activeInquiry.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeInquiry.status === "new" ? (
                    <form action={updateInquiryStatus}>
                      <input type="hidden" name="id" value={activeInquiry.id} />
                      <input type="hidden" name="status" value="read" />
                      <button className="rounded-lg bg-adminBlue px-4 py-2 text-sm font-black text-white" type="submit">
                        Mark as Read
                      </button>
                    </form>
                  ) : null}
                  <form action={updateInquiryStatus}>
                    <input type="hidden" name="id" value={activeInquiry.id} />
                    <input type="hidden" name="status" value="replied" />
                    <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-black text-white" type="submit">
                      Mark as Replied
                    </button>
                  </form>
                  <form action={updateInquiryStatus}>
                    <input type="hidden" name="id" value={activeInquiry.id} />
                    <input type="hidden" name="status" value={activeInquiry.status === "archived" ? "read" : "archived"} />
                    <button className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-black text-slate-700" type="submit">
                      {activeInquiry.status === "archived" ? "Unarchive" : "Archive"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl bg-slate-50 p-5 md:grid-cols-2">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">From</span>
                  <p className="mt-1 text-sm font-black text-slate-950">{activeInquiry.name}</p>
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Email</span>
                  <p className="mt-1 text-sm font-black text-slate-950">{activeInquiry.email}</p>
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Company</span>
                  <p className="mt-1 text-sm font-black text-slate-950">{activeInquiry.company || "Not provided"}</p>
                </div>
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Message</span>
                <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-700">{activeInquiry.message}</p>
              </div>
            </article>
          ) : (
            <div className="grid min-h-[620px] place-items-center px-6 text-center">
              <p className="text-sm font-bold text-slate-500">Select an inquiry to preview the message.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
