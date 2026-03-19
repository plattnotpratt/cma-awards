import { apiGet } from "./client";

// Adjust endpoints to match your API:
export function getAwards(params) {
  if (params === undefined) params = "";
  return apiGet(`/Applications${params}`);
}

export function getAwardById(id) {
  return apiGet(`/Applications/${id}`);
}