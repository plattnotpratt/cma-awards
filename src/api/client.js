import { clearAccessToken, getAccessToken } from "./access";

export async function localApiGet(path) {
  const token = getAccessToken();
  const res = await fetch(`/local-api${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) clearAccessToken();
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `GET ${path} failed (${res.status})`);
  }

  return res.json();
}
