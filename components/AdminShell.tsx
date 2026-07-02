"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";

type AdminShellProps = {
  children: ReactNode;
  role?: string | null;
  sessionTimeout: ReactNode;
  userMenu: ReactNode;
};

export function AdminShell({ children, role, sessionTimeout, userMenu }: AdminShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="admin-shell-grid">
      {sessionTimeout}
      <AdminSidebar role={role} />

      <div className={`admin-mobile-drawer ${isMenuOpen ? "is-open" : ""}`} aria-hidden={!isMenuOpen}>
        <button
          aria-label="Close menu"
          className="admin-mobile-backdrop"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />
        <div className="admin-mobile-panel">
          <div className="admin-mobile-panel-head">
            <span>Menu</span>
            <button aria-label="Close menu" onClick={() => setIsMenuOpen(false)} type="button">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <AdminSidebar onNavigate={() => setIsMenuOpen(false)} role={role} variant="mobile" />
        </div>
      </div>

      <div className="admin-content min-w-0">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <button
              aria-expanded={isMenuOpen}
              aria-label="Open menu"
              className="admin-menu-button"
              onClick={() => setIsMenuOpen(true)}
              type="button"
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-adminBlue">Bravo & Beyond</p>
              <strong>Admin System</strong>
            </div>
          </div>
          {userMenu}
        </header>
        <main className="p-5 pt-0 md:p-8 md:pt-0">{children}</main>
      </div>
    </div>
  );
}
