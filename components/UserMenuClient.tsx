"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { changeOwnPassword, type PasswordChangeState } from "@/app/account/actions";
import { signOut } from "@/app/login/actions";
import { passwordPolicyText } from "@/lib/password-policy";

type UserMenuClientProps = {
  displayName: string;
  initials: string;
  roleLabel: string;
};

const initialState: PasswordChangeState = {
  message: "",
  status: "idle"
};

export function UserMenuClient({ displayName, initials, roleLabel }: UserMenuClientProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(changeOwnPassword, initialState);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const closeTimer = window.setTimeout(() => {
      setIsPasswordOpen(false);
    }, 700);

    return () => window.clearTimeout(closeTimer);
  }, [state.status]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  function openPasswordModal() {
    setIsMenuOpen(false);
    setIsPasswordOpen(true);
  }

  const passwordModal = (
    <div className="user-modal-backdrop password-modal-backdrop" role="presentation">
      <section className="password-modal" aria-label="Change password" role="dialog" aria-modal="true">
        <header className="user-modal-header">
          <div>
            <p>Settings</p>
            <h2>Change Password</h2>
          </div>
          <button type="button" aria-label="Close change password" onClick={() => setIsPasswordOpen(false)}>
            Close
          </button>
        </header>
        <form action={formAction} className="password-modal-form">
          <label>
            New password
            <input autoComplete="new-password" name="password" required type="password" />
          </label>
          <label>
            Confirm password
            <input autoComplete="new-password" name="confirm_password" required type="password" />
          </label>
          <p>{passwordPolicyText}</p>
          {state.message ? (
            <div className={state.status === "success" ? "password-modal-success" : "password-modal-error"}>
              {state.message}
            </div>
          ) : null}
          <button disabled={isPending} type="submit">
            {isPending ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );

  return (
    <>
      <details ref={menuRef} className="user-menu" open={isMenuOpen} onToggle={(event) => setIsMenuOpen(event.currentTarget.open)}>
        <summary aria-label="Open user menu">
          <span className="user-menu-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="user-menu-copy">
            <strong>{displayName}</strong>
            <small>{roleLabel}</small>
          </span>
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="M5.6 7.4 10 11.8l4.4-4.4 1.2 1.2L10 14.2 4.4 8.6l1.2-1.2Z" />
          </svg>
        </summary>
        <div className="user-menu-dropdown">
          <button className="settings-button" type="button" onClick={openPasswordModal}>Settings</button>
          <form action={signOut}>
            <button className="logout-button" type="submit">Logout</button>
          </form>
        </div>
      </details>

      {isPasswordOpen ? createPortal(passwordModal, document.body) : null}
    </>
  );
}
