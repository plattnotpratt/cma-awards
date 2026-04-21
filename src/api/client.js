const API_KEY = import.meta.env.VITE_OPEN_WATER_API_KEY;
const CLIENT_KEY = import.meta.env.VITE_OPEN_WATER_CLIENT_KEY;

export async function localApiGet(path) {
  const res = await fetch(`/local-api${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `GET ${path} failed (${res.status})`);
  }

  return res.json();
}

export async function apiGet(path, p) {
  if (p === undefined) {
    p = "";
  }
  const res = await fetch(`/api/v2${path}${p}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-ClientKey": CLIENT_KEY,
      "X-ApiKey": API_KEY,
      "X-SuppressEmails": "true",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${path} failed (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}
