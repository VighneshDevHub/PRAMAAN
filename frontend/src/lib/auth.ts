import { getApiBaseUrl } from "./config";

const TOKEN_KEY = "pramaan_token";

const EMAIL_KEY = "pramaan_email";
const ROLE_KEY = "pramaan_role";
const USER_ID_KEY = "pramaan_user_id";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem("forensicguard_token");
}

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY) ?? localStorage.getItem("forensicguard_email");
}

export function getStoredRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY) ?? localStorage.getItem("forensicguard_role");
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY) ?? localStorage.getItem("forensicguard_user_id");
}


function setSession(
  token: string,
  email: string,
  role?: string,
  userId?: string,
): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
  if (role) localStorage.setItem(ROLE_KEY, role);
  if (userId) localStorage.setItem(USER_ID_KEY, userId);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export class AuthError extends Error {}

async function authErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string | Array<{ msg?: string }>;
    };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail.map((item) => item.msg ?? "Invalid value").join("; ");
    }
  } catch {
    // Use the stable fallback when the server returns a non-JSON error.
  }
  return fallback;
}

export async function login(email: string, password: string): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!res.ok) {
    throw new AuthError(
      await authErrorMessage(res, "Incorrect email or password"),
    );
  }
  const data = await res.json();
  // data.role and data.user_id are returned by the backend TokenResponse schema
  setSession(
    data.access_token,
    email,
    data.role ?? undefined,
    data.user_id ?? undefined,
  );
}

export async function register(
  email: string,
  password: string,
  role:
    | "ADMINISTRATOR"
    | "INVESTIGATOR"
    | "AUDITOR"
    | "SUPERVISOR" = "INVESTIGATOR",
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password, role }),
  });
  if (res.status === 409) {
    throw new AuthError(
      "An account with this email already exists — try signing in instead.",
    );
  }
  if (!res.ok) {
    throw new AuthError(await authErrorMessage(res, "Registration failed"));
  }
}

export function logout(): void {
  clearSession();
}
