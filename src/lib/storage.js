// Extension configuration persisted in browser.storage.local, which survives
// browser restarts and reboots. Nothing leaves the browser except calls the
// user makes to their own server.

const DEFAULTS = {
  serverUrl: "",
  token: "", // long-lived token
  username: "",
  householdId: null,
  householdName: "",
};

export async function getConfig() {
  const stored = await browser.storage.local.get(DEFAULTS);
  return { ...DEFAULTS, ...stored };
}

export async function setConfig(partial) {
  await browser.storage.local.set(partial);
}

export function isLoggedIn(cfg) {
  return Boolean(cfg.serverUrl && cfg.token && cfg.householdId);
}

// Clear the session but keep the server address to prefill the next login.
export async function logout() {
  await browser.storage.local.remove([
    "token",
    "username",
    "householdId",
    "householdName",
  ]);
}
