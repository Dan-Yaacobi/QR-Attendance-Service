const device_key = "device_id"

export function saveDeviceId(device_id) {
  try {
    console.log("trying to save");
    localStorage.setItem(device_key, device_id);
    const saved = localStorage.getItem(device_key);
    console.log("saved in localStorage:", saved);
    return saved || null;
  } catch (err) {
    console.error("Failed to save to localStorage", err);
    return null;
  }
}

export async function findDeviceId(){
    try {
        const deviceId = localStorage.getItem(device_key);
        return deviceId || null;
    }
    catch (err) {
    // localStorage not accessible
        return null;
    }
}