// Service Worker for Push Notifications
// MPB Health CRM

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/assets/mpb-logo.png',
    badge: data.badge || '/assets/mpb-badge.png',
    tag: data.tag,
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MPB Health', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/admin/crm';

  if (data.url) {
    url = data.url;
  } else if (data.leadId) {
    url = '/admin/crm/leads/' + data.leadId;
  }

  if (event.action === 'view') {
    url = data.url || '/admin/crm';
  } else if (event.action === 'call' && data.phone) {
    url = 'tel:' + data.phone;
  } else if (event.action === 'complete' && data.taskId) {
    // Could trigger task completion via fetch
    url = data.url || '/admin/crm';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (const client of clientList) {
          if (client.url.includes('/admin') && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', data: data });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  // Track notification dismissal if needed
  console.log('Notification closed:', event.notification.tag);
});

// Handle background sync for offline actions
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-crm-data') {
    event.waitUntil(syncCRMData());
  }
});

async function syncCRMData() {
  // Placeholder for background sync functionality
  console.log('Background sync triggered');
}

