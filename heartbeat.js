export function sendHeartbeat(token) {
  if (!token) return;
  fetch("https://heartbeat.nafil-8895-s.workers.dev/api/heartbeat", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token }
  });
}
