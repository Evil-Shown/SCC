import api from "../services/api.js";
import store from "../store/store.js";
import { getAccessToken } from "./authStorage.js";

/**
 * Keep axios default Authorization in sync with storage + Redux so every request
 * (including multipart) carries the JWT without relying on async interceptors.
 */
export function startApiAuthDefaultSync() {
  const run = () => {
    const fromStorage = getAccessToken();
    const fromRedux = store.getState().auth.accessToken;
    const token = fromStorage || fromRedux || null;
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  };
  run();
  return store.subscribe(run);
}
