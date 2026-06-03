const ACCESS_STORAGE_KEY = "cmaAwardsAccess";
const devAccessEnabled = import.meta.env.DEV && import.meta.env.VITE_AWARDS_ACCESS_ENABLED !== "false";

if (import.meta.env.DEV) {
  window.clearCmaAwardsAccess = () => {
    clearAccessToken();
    window.location.reload();
  };
}

function readStoredAccess() {
  try {
    return JSON.parse(window.localStorage.getItem(ACCESS_STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function getAccessToken() {
  const access = readStoredAccess();

  if (!access?.token || !Number.isFinite(access.expiresAt) || access.expiresAt <= Date.now()) {
    clearAccessToken();
    return "";
  }

  return access.token;
}

export function saveAccessToken(token, expiresAt) {
  window.localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify({ token, expiresAt }));
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_STORAGE_KEY);
}

export async function getAccessStatus() {
  const response = await fetch("/local-api/access/status", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) throw new Error(`Access status failed (${response.status})`);
  const data = await response.json();
  return { ...data, enabled: data.enabled || devAccessEnabled };
}

export async function verifyAccessPassword(password) {
  const response = await fetch("/local-api/access/verify", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Invalid password");
  }

  return response.json();
}
