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
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
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
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === "basic" ||
                networkResponse.type === "cors")
            ) {
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
      fetch(event.request).catch(() => {
        return enqueueRequest(event.request).then(() => {
          return new Response(null, { status: 202, statusText: "Queued" });
        });
      })
    );
  }
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

async function enqueueRequest(request) {
  const db = await idb.openDB("request-queue", 1, {
    upgrade(db) {
      db.createObjectStore("requests", { keyPath: "id", autoIncrement: true });
    },
  });

  const queuedRequest = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
  };

  const tx = db.transaction("requests", "readwrite");
  await tx.objectStore("requests").add(queuedRequest);
  await tx.complete;

  replayQueuedRequests(); // Always trigger replay, regardless of Background Sync support
}

async function replayQueuedRequests() {
  const db = await idb.openDB("request-queue", 1);
  const tx = db.transaction("requests", "readonly");
  const store = tx.objectStore("requests");
  const requests = await store.getAll();

  for (const queuedRequest of requests) {
    const headers = new Headers(queuedRequest.headers);

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
        await txDelete.complete;
      }
    } catch (error) {
      console.error("Replay queued request failed", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000)); // Increased delay to 5 seconds
  }
}

// Periodically trigger replay of queued requests
setInterval(replayQueuedRequests, 60000); // Run every 60 seconds
