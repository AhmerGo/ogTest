importScripts("/idb.js");

const CACHE_NAME = "my-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/static/js/bundle.js",
  "/static/js/0.chunk.js",
  "/static/js/main.chunk.js",
  "/static/js/vendors~main.chunk.js",
  "/static/css/main.css",
  "/manifest.json",
  "/favicon.ico",
  "/icons/logo192.png",
  "/icons/logo512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method === "GET") {
    event.respondWith(
      (async () => {
        if (!navigator.onLine) {
          const cacheResponse = await caches.match(event.request);
          return cacheResponse || fetch(event.request);
        } else {
          try {
            const networkResponse = await fetch(event.request);
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              const cache = await caches.open(CACHE_NAME);
              cache.put(event.request, responseToCache);
            }
            return networkResponse;
          } catch (error) {
            const cacheResponse = await caches.match(event.request);
            return cacheResponse;
          }
        }
      })()
    );
  } else if (["POST", "DELETE", "PATCH"].includes(event.request.method)) {
    event.respondWith(
      fetch(event.request.clone()).catch(() => {
        return event.request
          .clone()
          .text()
          .then((body) => enqueueRequest(event.request, body))
          .then(
            () => new Response(null, { status: 202, statusText: "Accepted" })
          );
      })
    );
  }
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

async function enqueueRequest(request, body) {
  const db = await idb.openDB("request-queue", 1, {
    upgrade(db) {
      db.createObjectStore("requests", { keyPath: "id", autoIncrement: true });
    },
  });

  const queuedRequest = {
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: body,
  };

  const tx = db.transaction("requests", "readwrite");
  await tx.objectStore("requests").add(queuedRequest);
  await tx.done;

  if ("sync" in self.registration) {
    self.registration.sync.register("replay-queued-requests");
  } else {
    setTimeout(replayQueuedRequests, 5000); // Delay to avoid immediate reprocessing
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "replay-queued-requests") {
    event.waitUntil(replayQueuedRequests());
  }
});

async function replayQueuedRequests() {
  const db = await idb.openDB("request-queue", 1);
  const tx = db.transaction("requests", "readonly");
  const store = tx.objectStore("requests");
  const requests = await store.getAll();

  for (const queuedRequest of requests) {
    const headers = new Headers(queuedRequest.headers);
    if (queuedRequest.body) {
      headers.set("Content-Type", "application/json");
    }

    const fetchOptions = {
      method: queuedRequest.method,
      headers: headers,
      body: queuedRequest.body,
    };

    try {
      const networkResponse = await fetch(queuedRequest.url, fetchOptions);
      if (networkResponse.ok) {
        const txDelete = db.transaction("requests", "readwrite");
        await txDelete.objectStore("requests").delete(queuedRequest.id);
        await txDelete.done;
      }
    } catch (error) {
      console.error("Replay queued request failed", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
