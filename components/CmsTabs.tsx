import Link from "next/link";
import { cmsNavItems } from "@/lib/navigation";

export function CmsTabs() {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {cmsNavItems.map((item) => (
        <Link key={item.href} href={item.href} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
          {item.label}
        </Link>
      ))}
    </div>
  );
}
