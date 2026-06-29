/**
 * Best-effort device geolocation for attendance clock-in.
 *
 * Resolves to coordinates when the user grants permission, or `null` when
 * permission is denied, the API is unavailable, or the lookup times out.
 * Callers should treat a null result as "no location" and proceed anyway —
 * location must never block clocking in.
 */

export interface DeviceCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export async function getDeviceLocation(
  timeoutMs = 8000,
): Promise<DeviceCoordinates | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      // Denied / unavailable / timed out → resolve null, never reject.
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
  });
}
