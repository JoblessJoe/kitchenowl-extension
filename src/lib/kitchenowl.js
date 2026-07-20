// KitchenOwl API client.
//
// Every call goes straight from the user's browser to the user's self-hosted
// KitchenOwl server. There is no backend of our own.
//
// Endpoints confirmed against the KitchenOwl backend source (AGPL-3.0,
// TomBursch/kitchenowl):
//   POST /api/auth                                                -> log in (username/password)
//   POST /api/auth/llt                                            -> mint a long-lived token
//   GET  /api/household                                           -> list households
//   GET  /api/household/<householdId>/recipe/scrape?url=<pageUrl> -> scraped recipe
//   POST /api/household/<householdId>/recipe                      -> create recipe

const DEVICE_NAME = "Firefox extension";

export function apiBase(serverUrl) {
  // Strip trailing slashes so we can safely append /api/...
  return serverUrl.replace(/\/+$/, "");
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

const REQUEST_TIMEOUT_MS = 12000;

async function request(url, options) {
  let res;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    res = await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error(
        "The server didn't respond. This often means Firefox is upgrading the " +
          "address to HTTPS but your server only serves HTTP. Turn off HTTPS-Only " +
          "mode for this site, or use the plain http:// address."
      );
    }
    throw new Error(
      `Could not reach the server. Check the address and that KitchenOwl is online. (${e.message})`
    );
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("Authentication failed. Check your details and try again.");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}). ${body.slice(0, 200)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
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

// Log in with username/password, then immediately mint a long-lived token so
// the session survives browser restarts and reboots without re-entering the
// password. Returns { token, user }.
export async function loginAndGetToken({ serverUrl, username, password }) {
  const base = apiBase(serverUrl);
  const auth = await request(`${base}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, device: DEVICE_NAME }),
  });
  const llt = await request(`${base}/api/auth/llt`, {
    method: "POST",
    headers: authHeaders(auth.access_token),
    body: JSON.stringify({ device: DEVICE_NAME }),
  });
  return { token: llt.longlived_token, user: auth.user };
}

export async function listHouseholds({ serverUrl, token }) {
  return request(`${apiBase(serverUrl)}/api/household`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

export async function scrapeRecipe({ serverUrl, token, householdId }, pageUrl) {
  const url = `${apiBase(serverUrl)}/api/household/${householdId}/recipe/scrape?url=${encodeURIComponent(
    pageUrl
  )}`;
  return request(url, { method: "GET", headers: authHeaders(token) });
}

export async function addRecipe({ serverUrl, token, householdId }, recipe) {
  // NOTE: we forward the scraped recipe object as-is. If the create endpoint
  // rejects it, map fields to RecipeSchema in the KitchenOwl backend. The
  // scrape -> prefill -> POST pattern mirrors the KitchenOwl frontend.
  const url = `${apiBase(serverUrl)}/api/household/${householdId}/recipe`;
  return request(url, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(recipe),
  });
}
