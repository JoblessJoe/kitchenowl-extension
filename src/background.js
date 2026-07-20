// Network layer. All KitchenOwl API calls run here, in the background script,
// because in Firefox MV3 only background scripts get the cross-origin fetch
// privilege from a (runtime-granted) host permission — a fetch from the popup
// or options page is still subject to CORS and gets blocked. The pages send a
// message; we do the fetch and return the result.
//
// Classic background script (no ES modules), so this is self-contained.

const DEVICE_NAME = "Firefox extension";
const REQUEST_TIMEOUT_MS = 12000;

function apiBase(serverUrl) {
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    res = await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error("The server didn't respond. Check the address and that KitchenOwl is online.");
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

// Log in, mint a long-lived token, and fetch households in one round trip.
async function login({ serverUrl, username, password }) {
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
  const token = llt.longlived_token;
  const households = await request(`${base}/api/household`, {
    method: "GET",
    headers: authHeaders(token),
  });
  return { token, user: auth.user, households };
}

async function listHouseholds({ serverUrl, token }) {
  return request(`${apiBase(serverUrl)}/api/household`, {
    method: "GET",
    headers: authHeaders(token),
  });
}

async function scrapeRecipe({ serverUrl, token, householdId }, pageUrl) {
  const url = `${apiBase(serverUrl)}/api/household/${householdId}/recipe/scrape?url=${encodeURIComponent(
    pageUrl
  )}`;
  return request(url, { method: "GET", headers: authHeaders(token) });
}

async function addRecipe({ serverUrl, token, householdId }, recipe) {
  // Forward the scraped recipe object as-is. If the create endpoint rejects it,
  // map fields to RecipeSchema in the KitchenOwl backend.
  const url = `${apiBase(serverUrl)}/api/household/${householdId}/recipe`;
  return request(url, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(recipe),
  });
}

// Message router. Every handler returns { ok, data } or { ok:false, error } so
// friendly error messages survive the message boundary.
browser.runtime.onMessage.addListener(async (msg) => {
  try {
    switch (msg && msg.cmd) {
      case "login":
        return { ok: true, data: await login(msg) };
      case "listHouseholds":
        return { ok: true, data: await listHouseholds(msg.cfg) };
      case "scrape":
        return { ok: true, data: await scrapeRecipe(msg.cfg, msg.pageUrl) };
      case "addRecipe":
        return { ok: true, data: await addRecipe(msg.cfg, msg.recipe) };
      default:
        return { ok: false, error: "Unknown command." };
    }
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
});
