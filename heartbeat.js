export function sendHeartbeat(token) {
  if (!token) return;
  fetch("/api/user/heartbeat", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token }
  });
}
