/**
 * Auth tokens in sessionStorage + localStorage mirror.
 * sessionStorage alone is not shared across browser tabs, which caused
 * "No token provided" when opening the app or OAuth return in a new tab.
 */
const USER = "user";
const ACCESS = "accessToken";
const REFRESH = "refreshToken";

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS) || localStorage.getItem(ACCESS);
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH) || localStorage.getItem(REFRESH);
}

export function getStoredUser() {
  const raw = sessionStorage.getItem(USER) || localStorage.getItem(USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function persistAuth({ user, accessToken, refreshToken }) {
  if (user != null) {
    const json = typeof user === "string" ? user : JSON.stringify(user);
    sessionStorage.setItem(USER, json);
    localStorage.setItem(USER, json);
  }
  if (accessToken != null) {
    sessionStorage.setItem(ACCESS, accessToken);
    localStorage.setItem(ACCESS, accessToken);
  }
  if (refreshToken != null) {
    sessionStorage.setItem(REFRESH, refreshToken);
    localStorage.setItem(REFRESH, refreshToken);
  }
}

export function persistUser(user) {
  if (user == null) return;
  const json = typeof user === "string" ? user : JSON.stringify(user);
  sessionStorage.setItem(USER, json);
  localStorage.setItem(USER, json);
}

export function clearAuthStorage() {
  sessionStorage.removeItem(USER);
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(REFRESH);
  localStorage.removeItem(USER);
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}

// Run on first import (before Redux initialState) so session-only logins are mirrored to localStorage.
(function mirrorSessionToLocalOnLoad() {
  try {
    const a = sessionStorage.getItem(ACCESS);
    if (!a || localStorage.getItem(ACCESS)) return;
    const r = sessionStorage.getItem(REFRESH);
    const u = sessionStorage.getItem(USER);
    let userObj;
    if (u) {
      try {
        userObj = JSON.parse(u);
      } catch {
        userObj = undefined;
      }
    }
    persistAuth({
      ...(userObj ? { user: userObj } : {}),
      accessToken: a,
      ...(r ? { refreshToken: r } : {})
    });
  } catch {
    /* ignore */
  }
})();
