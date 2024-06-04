importScripts("idb.js");

const CACHE_NAME = "my-app-cache-v1";
const QUEUE_NAME = "request-queue";
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
      (async () => {
        if (!navigator.onLine) {
          const body = await event.request.clone().text();
          await enqueueRequest(event.request, body);
          return new Response(null, { status: 202, statusText: "Queued" });
        } else {
          return fetch(event.request);
        }
      })()
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

async function enqueueRequest(request, body) {
  const db = await idb.openDB("my-app-db", 1, {
    upgrade(db) {
      db.createObjectStore(QUEUE_NAME, { keyPath: "id" });
    },
  });

  const queuedRequest = {
    id: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: body,
  };

  const tx = db.transaction(QUEUE_NAME, "readwrite");
  const store = tx.objectStore(QUEUE_NAME);
  await store.put(queuedRequest);
  await tx.done;
}

self.addEventListener("sync", (event) => {
  if (event.tag === "replay-queued-requests") {
    event.waitUntil(replayQueuedRequests());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "replay-queued-requests") {
    event.waitUntil(replayQueuedRequests());
  }
});

async function replayQueuedRequests() {
  const db = await idb.openDB("my-app-db", 1);

  const tx = db.transaction(QUEUE_NAME, "readonly");
  const store = tx.objectStore(QUEUE_NAME);
  const requests = await store.getAll();
  await tx.done;

  for (const queuedRequest of requests) {
    const headers = new Headers(queuedRequest.headers);
    const fetchOptions = {
      method: queuedRequest.method,
      headers: headers,
      body: queuedRequest.body,
    };

    try {
      const response = await fetch(queuedRequest.url, fetchOptions);
      if (response.ok) {
        const tx = db.transaction(QUEUE_NAME, "readwrite");
        const store = tx.objectStore(QUEUE_NAME);
        await store.delete(queuedRequest.id);
        await tx.done;
      }
    } catch (error) {
      console.error("Replay queued request failed", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
