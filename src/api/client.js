const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function apiGet(path, p) {
  if (p === undefined) {
    p = "";
  }
  const res = await fetch(`/api/v2${path}${p}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-ClientKey": "catholicpress.secure-platform.com",
      "X-ApiKey": "dac475a4-24c5-41df-b24c-0ce932a72e97",
      "X-SuppressEmails": "true",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${path} failed (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}