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
