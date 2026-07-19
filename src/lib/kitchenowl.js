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

async function request(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    throw new Error(
      `Could not reach the server. Check the address and that KitchenOwl is online. (${e.message})`
    );
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

// Optional host permission for the user's server origin. Must be called from a
// user gesture (e.g. a button click), which popup/options handlers satisfy.
export async function ensureHostPermission(serverUrl) {
  const origin = new URL(serverUrl).origin + "/*";
  if (await browser.permissions.contains({ origins: [origin] })) return true;
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
