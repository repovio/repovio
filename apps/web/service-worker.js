/* global self */

import { cleanupOutdatedCaches, precacheAndRoute } from '@vite-pwa/workbox-swkit/precaching';

self.importScripts('/notification-sw.js');

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener(
  'message',
  /** Activates the waiting worker after the user accepts the update. */ (event) => {
    if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
  },
);
