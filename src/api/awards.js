import { apiGet, localApiGet } from "./client";

export function getAwards() {
  return localApiGet("/awards");
}

export function getAwardById(id) {
  return apiGet(`/Applications/${id}`);
}
