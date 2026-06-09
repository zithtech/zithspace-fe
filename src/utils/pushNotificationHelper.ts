import { api } from '@/lib/axios';

/**
 * Ask the user for system-level desktop notification permission.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Push Notification] Browser does not support desktop notifications.');
    return false;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (err) {
      console.error('[Push Notification] Error requesting permission:', err);
    }
  }

  return permission === 'granted';
}

/**
 * Helper to convert standard Base64 VAPID public keys to Uint8Array for PushManager.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the Service Worker and registers the user to the Push Service.
 */
export async function registerPushNotifications(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push Notification] Service Worker or Push Manager not supported in this browser.');
    return;
  }

  try {
    // 1. Ensure permission is granted
    const isGranted = await requestNotificationPermission();
    if (!isGranted) {
      console.log('[Push Notification] Notification permission denied.');
      return;
    }

    // 2. Register Service Worker sw.js
    console.log('[Push Notification] Registering Service Worker...');
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[Push Notification] Service Worker registered successfully.');

    // 3. Fetch public VAPID key from backend
    console.log('[Push Notification] Fetching public VAPID key...');
    const { publicKey } = await api.get('/api/notifications/vapid-public-key');
    if (!publicKey) {
      console.error('[Push Notification] Public VAPID key not returned from backend.');
      return;
    }

    // Check if there is an existing subscription and unsubscribe first to avoid VAPID key mismatches
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('[Push Notification] Existing subscription found. Refreshing key subscription...');
      await existingSubscription.unsubscribe().catch(err => {
        console.warn('[Push Notification] Failed to unsubscribe existing push registration:', err);
      });
    }

    // 4. Subscribe user browser session to PushManager
    console.log('[Push Notification] Subscribing to PushManager...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
    });

    // 5. Send subscription endpoint details to backend
    console.log('[Push Notification] Storing subscription in backend...');
    const parsedSub = JSON.parse(JSON.stringify(subscription));
    
    await api.post('/api/notifications/subscribe', {
      endpoint: parsedSub.endpoint,
      keys: {
        auth: parsedSub.keys?.auth,
        p256dh: parsedSub.keys?.p256dh
      }
    });

    console.log('✅ Web Push Notification subscription complete.');
  } catch (error: any) {
    console.error('[Push Notification] Failed to subscribe to push notifications:', error.message || error);
  }
}
