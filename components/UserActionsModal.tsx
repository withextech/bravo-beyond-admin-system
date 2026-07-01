"use client";

import { useState } from "react";
import {
  activateAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
  suspendAdminUser,
  updateAdminUser
} from "@/app/(admin)/users/actions";
import { passwordPolicyText } from "@/lib/password-policy";

type UserActionsModalProps = {
  adminSetupMissing: boolean;
  currentUserId?: string;
  roleOptions: Array<{
    label: string;
    value: string;
  }>;
  user: {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: string;
    is_suspended: boolean;
  };
};

export function UserActionsModal({ adminSetupMissing, currentUserId, roleOptions, user }: UserActionsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const isCurrentUser = currentUserId === user.id;

  return (
    <>
      <button className="user-row-edit" type="button" onClick={() => setIsOpen(true)}>
        Edit
      </button>

      {isOpen ? (
        <div className="user-modal-backdrop" role="presentation">
          <section className="user-modal" aria-label={`Edit ${user.full_name}`} role="dialog" aria-modal="true">
            <header className="user-modal-header">
              <div>
                <p>User Settings</p>
                <h2>{user.full_name}</h2>
              </div>
              <button type="button" aria-label="Close user settings" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </header>

            {!isCurrentUser ? (
              <div className="user-modal-toolbar">
                {!showPasswordReset ? (
                  <button className="secondary" disabled={adminSetupMissing} type="button" onClick={() => setShowPasswordReset(true)}>
                    Reset password
                  </button>
                ) : null}
                {user.is_suspended ? (
                  <form action={activateAdminUser}>
                    <input name="id" type="hidden" value={user.id} />
                    <button disabled={adminSetupMissing} type="submit">Activate</button>
                  </form>
                ) : (
                  <form action={suspendAdminUser}>
                    <input name="id" type="hidden" value={user.id} />
                    <button disabled={adminSetupMissing} type="submit">Suspend</button>
                  </form>
                )}
                <form action={deleteAdminUser}>
                  <input name="id" type="hidden" value={user.id} />
                  <button className="danger" disabled={adminSetupMissing} type="submit">Delete</button>
                </form>
              </div>
            ) : null}

            {!isCurrentUser && showPasswordReset ? (
              <form action={resetAdminUserPassword} className="user-modal-password-form">
                <input name="id" type="hidden" value={user.id} />
                <label>
                  Temporary password
                  <input name="password" required type="password" />
                </label>
                <p>{passwordPolicyText}</p>
                <button disabled={adminSetupMissing} type="submit">
                  Apply reset
                </button>
                <button className="secondary" type="button" onClick={() => setShowPasswordReset(false)}>
                  Cancel
                </button>
              </form>
            ) : null}

            <form action={updateAdminUser} className="user-modal-form">
              <input name="id" type="hidden" value={user.id} />
              <label>
                Full name
                <input defaultValue={user.full_name} name="full_name" required />
              </label>
              <label>
                Username
                <input defaultValue={user.username} name="username" required />
              </label>
              <label>
                Email
                <input defaultValue={user.email} name="email" required type="email" />
              </label>
              <label>
                Role
                <select defaultValue={user.role} name="role">
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </label>
              <div className="user-modal-footer">
                <button disabled={adminSetupMissing} type="submit">
                  Save changes
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
