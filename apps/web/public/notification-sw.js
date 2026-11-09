/* global self, URL */

self.addEventListener(
  'push',
  /** Displays the received push payload as a browser notification. */ (event) => {
    let payload = {};
    try {
      const data = event.data?.json();
      if (data && typeof data === 'object') payload = data;
    } catch {
      // Invalid payloads still produce a safe generic notification.
    }
    event.waitUntil(
      self.registration.showNotification(payload.title ?? 'Repovio', {
        body: payload.body ?? '',
        data: { url: notificationTarget(payload.url) },
        icon: '/favicon.svg',
      }),
    );
  },
);

self.addEventListener(
  'notificationclick',
  /** Closes the notification and focuses or opens its destination. */ (event) => {
    event.notification.close();
    const target = notificationTarget(event.notification.data?.url);
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(
        /** Focuses a matching browser window or opens a new one for the notification URL. */ (clients) => {
          const client = clients.find(
            /** Finds the first entry matching `candidate.url === target`. */ (candidate) => candidate.url === target,
          );
          return client ? client.focus() : self.clients.openWindow(target);
        },
      ),
    );
  },
);

/**
 * Resolve only credential-free HTTP(S) targets, including for notifications saved by an older worker.
 * @param {unknown} value Untrusted destination supplied by the notification payload.
 * @returns {string} Safe absolute destination or the application root.
 */
function notificationTarget(value) {
  try {
    const url = new URL(typeof value === 'string' ? value : '/', self.location.origin);
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch {
    // Fall back to the current application rather than opening an invalid destination.
  }
  return new URL('/', self.location.origin).href;
}
