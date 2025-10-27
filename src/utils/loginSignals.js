// src/utils/loginSignals.js
export function markJustLoggedIn() {
  try {
    sessionStorage.setItem("just_logged_in", "1");
  } catch {}
}

export function consumeJustLoggedIn() {
  try {
    const v = sessionStorage.getItem("just_logged_in") === "1";
    if (v) sessionStorage.removeItem("just_logged_in");
    return v;
  } catch {
    return false;
  }
}
