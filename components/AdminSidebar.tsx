"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { activeNavItems, editorNavItems } from "@/lib/navigation";

type AdminSidebarProps = {
  role?: string | null;
};

function normalizePath(path: string | null) {
  if (!path) {
    return "/";
  }

  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = normalizePath(usePathname());
  const navItems = role === "editor" ? editorNavItems : activeNavItems;

  const itemClassName = useMemo(() => {
    return (href: string) => {
      const normalizedHref = normalizePath(href);
      const isActive = pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
      return `rounded-lg px-4 py-3 text-sm font-black text-slate-200 transition ${
        isActive
          ? "bg-slate-800 text-white border-l-4 border-slate-300 pl-3"
          : "hover:bg-slate-800/80 hover:text-white"
      }`;
    };
  }, [pathname]);

  return (
    <aside className="hidden bg-graphite p-5 text-white md:block">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <Image src="/assets/admin-bb-logo.jpg" alt="" width={48} height={48} className="rounded-xl object-cover" />
        <span className="grid">
          <strong className="leading-tight">Bravo & Beyond</strong>
          <small className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Admin System</small>
        </span>
      </Link>

      <nav className="grid gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === normalizePath(item.href) || pathname.startsWith(`${normalizePath(item.href)}/`) ? "page" : undefined}
            className={itemClassName(item.href)}
          >
            {item.label}
          </Link>
        ))}
      </nav>

    </aside>
  );
}
