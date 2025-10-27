// src/utils/welcomeSeen.js

export function hasSeenWelcome(memberId) {
  try {
    if (!memberId) return false;
    return localStorage.getItem(`welcome_seen:${memberId}`) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeSeen(memberId) {
  try {
    if (memberId) localStorage.setItem(`welcome_seen:${memberId}`, "1");
  } catch {}
}
