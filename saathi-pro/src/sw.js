/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener("push", (event) => {
  let payload = {
    title: "Saathi Partner",
    body: "New client request",
    url: "/pro/"
  };
  try {
    payload = { ...payload, ...(event.data ? event.data.json() : {}) };
  } catch {
    // default
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/pro/pro-icon.svg",
      badge: "/pro/pro-icon.svg",
      data: { url: payload.url || "/pro/" },
      tag: "saathi-pro-request",
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/pro/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return null;
    })
  );
});
