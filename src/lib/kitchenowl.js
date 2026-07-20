// Page-side helpers for popup/options.
//
// The actual KitchenOwl API calls live in the background script (src/background.js):
// in Firefox MV3 only background scripts get the cross-origin fetch privilege
// from a runtime-granted host permission, so a fetch straight from the popup or
// options page is blocked by CORS. Pages call `api()` below to message the
// background, which does the fetch.

export function apiBase(serverUrl) {
  // Strip trailing slashes so the server URL is safe to open / append to.
  return serverUrl.replace(/\/+$/, "");
}

// Optional host permission for the user's server origin. Firefox requires
// permissions.request() to run synchronously inside a user gesture, so this
// must be the FIRST async call in the click/submit handler — any prior `await`
// (including permissions.contains) consumes the gesture and Firefox then throws
// "permissions.request may only be called from a user input handler". We skip a
// contains() pre-check because request() already resolves true, without a
// prompt, when the origin is already granted.
export function ensureHostPermission(serverUrl) {
  const origin = new URL(serverUrl).origin + "/*";
  return browser.permissions.request({ origins: [origin] });
}

// Send a command to the background network layer and unwrap its { ok, data }
// envelope, re-throwing friendly errors that were raised during the fetch.
export async function api(cmd, params = {}) {
  const res = await browser.runtime.sendMessage({ cmd, ...params });
  if (!res || !res.ok) {
    throw new Error((res && res.error) || "Something went wrong.");
  }
  return res.data;
}
