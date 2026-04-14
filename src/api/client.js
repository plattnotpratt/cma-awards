const API_KEY = import.meta.env.VITE_OPEN_WATER_API_KEY;
const CLIENT_KEY = import.meta.env.VITE_OPEN_WATER_CLIENT_KEY;

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
