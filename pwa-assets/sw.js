// Minimal service worker — exists only to satisfy "installable PWA" criteria.
// Intentionally does NOT cache tool logic, API responses, or user data.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch handler (required by some browsers' install heuristics).
// No caching: every request goes straight to the network.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
