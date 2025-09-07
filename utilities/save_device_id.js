export function saveDeviceId(deviceId) {
  try {
    if (!deviceId) return false;
    localStorage.setItem('device_id', deviceId);
    return localStorage.getItem('device_id') === deviceId;
  } catch (_) {
    return false;
  }
}