self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Periodic execution ticker looking for expiring configurations
setInterval(() => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'CHECK_UPCOMING_BILLS' });
    });
  });
}, 900000); // Evaluates timelines quietly in the background every 15 minutes
