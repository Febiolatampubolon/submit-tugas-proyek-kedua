// Service Worker for Push Notifications and Caching
const CACHE_NAME = "story-catalog-v1";
const STATIC_CACHE = "story-catalog-static-v1";
const DYNAMIC_CACHE = "story-catalog-dynamic-v1";

// Static assets to cache (pastikan path sesuai subfolder hosting)
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/scripts/index.js",
  "/styles/styles.css",
  "/manifest.json",
  "/images/story.png",
  "/images/icon-512x512.png",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Failed to cache static assets", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle API requests to Story API
  if (url.origin === "https://story-api.dicoding.dev") {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              // Clone the response before caching
              const responseToCache = response.clone();
              cache.put(request, responseToCache).catch((error) => {
                console.warn("Failed to cache API response:", error);
              });
            }
            return response;
          })
          .catch(() => {
            // Return cached response when offline
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                console.log("Serving cached API response for:", request.url);
                return cachedResponse;
              }
              // Return offline fallback for API calls
              return new Response(
                JSON.stringify({
                  error: true,
                  message: "You are offline. Please check your connection.",
                }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                }
              );
            });
          });
      })
    );
    return;
  }

  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache same-origin successful responses
        if (
          request.url.startsWith(self.location.origin) &&
          response.status === 200
        ) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone).catch((error) => {
              console.warn("Failed to cache response:", error);
            });
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached response when offline
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }

          // Fallback to index.html for navigation requests
          if (
            request.destination === "document" ||
            request.headers.get("accept")?.includes("text/html")
          ) {
            return caches.match("/index.html");
          }

          // Return simple offline message for other requests
          return new Response("Offline - No cached content available", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" },
          });
        });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Service worker pushing...");

  async function chainPromise() {
    let data = {
      title: "New Notification",
      options: {
        body: "New data has been added.",
      },
    };

    if (event.data) {
      try {
        data = await event.data.json();
        console.log("Push data received:", data);
      } catch (e) {
        console.log("No JSON data in push, using default");
      }
    }

    const title = data.title || "New Notification";
    const body = data.options?.body || data.body || "New data has been added.";

    await self.registration.showNotification(title, {
      body: body,
      icon: data.options?.icon || "/images/story.png",
      badge: data.options?.badge || "/images/story.png",
      data: data.options?.data || {},
      tag: data.options?.tag || "story-notification",
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        {
          action: "view",
          title: "View",
        },
        {
          action: "close",
          title: "Close",
        },
      ],
    });
  }

  event.waitUntil(chainPromise());
});

// Notification click event - handle user interaction
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification click event", event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === "close") {
    return;
  }

  // Default action or 'view' action
  let urlToOpen = data?.url || "/#/stories";

  if (action === "view" && data?.storyId) {
    urlToOpen = `/#/stories/${data.storyId}`;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (
            client.url.includes(urlToOpen.split("#")[1]) &&
            "focus" in client
          ) {
            return client.focus();
          }
        }

        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          const baseUrl = self.location.origin;
          return clients.openWindow(baseUrl + urlToOpen);
        }
      })
  );
});

// Background sync for offline data
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync event", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync - will be implemented with IndexedDB
      Promise.resolve().then(() => {
        console.log("Background sync completed");
      })
    );
  }
});
