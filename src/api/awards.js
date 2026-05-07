import { localApiGet } from "./client";

export function getAwards() {
  return localApiGet("/awards");
}

export function getAwardById(id) {
  return localApiGet(`/awards/${encodeURIComponent(id)}`);
}
