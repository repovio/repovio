/* global self, URL */

self.addEventListener(
  'push',
  /** Displays the received push payload as a browser notification. */ (event) => {
    const payload = event.data?.json() ?? {};
    event.waitUntil(
      self.registration.showNotification(payload.title ?? 'Repovio', {
        body: payload.body ?? '',
        data: { url: payload.url || '/' },
        icon: '/favicon.svg',
      }),
    );
  },
);

self.addEventListener(
  'notificationclick',
  /** Closes the notification and focuses or opens its destination. */ (event) => {
    event.notification.close();
    const target = new URL(event.notification.data?.url || '/', self.location.origin).href;
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
