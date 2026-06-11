import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const swCode = `// Zukvo Service Worker

// Direct secure production URL for the Zukvo logo
const ZUKVO_LOGO_URL = 'https://www.zukvo.com/assets/mainLogo-CMOLjm94.png';

// Force immediate activation when a new service worker is installed
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    // Ensure title has Zukvo branding
    let title = data.title || 'Zukvo';
    if (!title.toLowerCase().includes('zukvo')) {
      title = \`Zukvo - \${title}\`;
    }

    // Determine context-based icon emoji and action title
    let emoji = '🔔';
    let actionTitle = 'Open Zukvo';
    if (data.url && data.url.includes('mail')) {
      emoji = '✉️';
      actionTitle = 'View Email';
    } else if (data.url && data.url.includes('calendar')) {
      emoji = '📅';
      actionTitle = 'View Calendar';
    }

    // Append the company website link/info and origin text to the body
    const displayBody = data.body 
      ? \`\${emoji} \${data.body}\\n\\nThis notification is coming from Zukvo (zukvo.in)\` 
      : \`\${emoji} This notification is coming from Zukvo (zukvo.in)\`;

    // Check for open tabs to trigger custom audio playback
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        let hasActiveTab = false;
        
        for (const client of clientList) {
          // Post message to the tab to trigger custom Javascript Audio
          client.postMessage({ type: 'PLAY_SOUND' });
          if (client.visibilityState === 'visible') {
            hasActiveTab = true;
          }
        }

        const options = {
          body: displayBody,
          icon: ZUKVO_LOGO_URL, // Small thumbnail icon
          badge: ZUKVO_LOGO_URL, // Taskbar/status bar badge
          tag: data.url ? data.url.split('?')[0] : 'zukvo-general',
          renotify: true, // Re-alert on update
          silent: hasActiveTab, // Silence OS notification chime if the Zukvo tab is open to play custom in-tab sound
          actions: [
            { action: 'view', title: actionTitle },
            { action: 'close', title: 'Dismiss' }
          ],
          data: {
            url: data.url || '/'
          }
        };

        return self.registration.showNotification(title, options);
      })
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push event payload:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If user clicked the "Dismiss" action button
  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const targetUrl = event.notification.data?.url || '/';

      // If a tab is already open with our URL, focus it
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }

      // If no tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
`;

export async function GET() {
  return new NextResponse(swCode, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
