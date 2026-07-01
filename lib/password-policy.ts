export const passwordPolicyText =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

export function validatePassword(password: string) {
  if (password.length < 8) {
    return passwordPolicyText;
  }

  if (!/[A-Z]/.test(password)) {
    return passwordPolicyText;
  }

  if (!/[a-z]/.test(password)) {
    return passwordPolicyText;
  }

  if (!/[0-9]/.test(password)) {
    return passwordPolicyText;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return passwordPolicyText;
  }

  return null;
}
