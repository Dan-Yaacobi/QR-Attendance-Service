const device_key = "device_id"
const params = new URLSearchParams(window.location.search);
const course_id = params.get("course_id");
const token = params.get("t");

export async function validateToken(token){
  //needs to build token validation
  return true
}

export async function getDeviceId() {
  if (validateToken(token)){
    try {
      const id = localStorage.getItem(device_key);
      if(id){
        fetch('/api/check_in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ found: Boolean(id), id: course_id }),
        }).catch(() => {});
        return id || null;
      }
      else{window.location.replace("./sign_in?course_id="+encodeURIComponent(course_id))
      }
    }
    catch {
      fetch('/api/check_in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ found: false, id: 'exception' }),
      }).catch(() => {});
      return null;
    }
  }
  else{
    console.log("Link Expired")
    course_id = 0
  }
}

await getDeviceId()

// export async function saveDeviceId(device_id) {
//   try {
//     localStorage.setItem(device_key, device_id);
//     const saved = localStorage.getItem(device_key);
//     console.log("saved in localStorage:", saved);
//     return saved || null;
//   } catch (err) {
//     console.error("Failed to save to localStorage", err);
//     return null;
//   }
// }
// function localStorageAvailable() {
//   try {
//     const test = '__test_key__';
//     window.localStorage.setItem(test, '1');
//     window.localStorage.removeItem(test);
//     return true;
//   } catch {
//     return false;
//   }
// }