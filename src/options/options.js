import { getConfig, setConfig, isLoggedIn, logout } from "../lib/storage.js";
import { ensureHostPermission, api } from "../lib/kitchenowl.js";

const loggedOut = document.getElementById("logged-out");
const loggedIn = document.getElementById("logged-in");
const accServer = document.getElementById("acc-server");
const accUser = document.getElementById("acc-user");
const householdEl = document.getElementById("household");
const saveHouseholdBtn = document.getElementById("save-household");
const logoutBtn = document.getElementById("logout");
const statusEl = document.getElementById("status");

const loginForm = document.getElementById("login-form");
const serverEl = document.getElementById("server");
const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginStatusEl = document.getElementById("login-status");

let config = null;

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = `status ${kind}`;
}

function setLoginStatus(text, kind = "") {
  loginStatusEl.textContent = text;
  loginStatusEl.className = `status ${kind}`;
}

function showLoggedIn() {
  loggedOut.classList.add("hidden");
  loggedIn.classList.remove("hidden");
  accServer.textContent = config.serverUrl;
  accUser.textContent = config.username || "—";
}

// Build <option> elements without innerHTML (avoids AMO UNSAFE_VAR_ASSIGNMENT
// and any injection from server-provided names).
function setOptions(items, selectedId) {
  householdEl.replaceChildren();
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = String(item.id);
    opt.textContent = item.name;
    if (selectedId != null && String(item.id) === String(selectedId)) {
      opt.selected = true;
    }
    householdEl.append(opt);
  }
}

async function init() {
  config = await getConfig();
  if (config.serverUrl) serverEl.value = config.serverUrl;
  if (!isLoggedIn(config)) {
    loggedOut.classList.remove("hidden");
    return;
  }
  showLoggedIn();

  // Show the saved household immediately, then refresh the full list.
  setOptions(
    [{ id: config.householdId, name: config.householdName || "Saved household" }],
    config.householdId
  );
  try {
    const households = await api("listHouseholds", { cfg: config });
    if (households?.length) setOptions(households, config.householdId);
  } catch (e) {
    setStatus(`Couldn't refresh households: ${e.message}`, "error");
  }
}

// Login runs here, in the full options tab, because Firefox can't reliably show
// the host-permission prompt over a toolbar popup (the prompt and popup overlap,
// and dismissing the popup cancels the request).
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const serverUrl = serverEl.value.trim();
  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  loginBtn.disabled = true;
  setLoginStatus("Requesting access to your server…", "busy");
  try {
    // Must be the first await so the user gesture is still active (see
    // ensureHostPermission).
    const granted = await ensureHostPermission(serverUrl);
    if (!granted) {
      setLoginStatus("Permission for your server was denied.", "error");
      loginBtn.disabled = false;
      return;
    }

    setLoginStatus("Logging in…", "busy");
    const { token, households } = await api("login", { serverUrl, username, password });

    if (!households?.length) {
      setLoginStatus("No households found on this account.", "error");
      loginBtn.disabled = false;
      return;
    }
    const household = households[0];

    await setConfig({
      serverUrl,
      token,
      username,
      householdId: household.id,
      householdName: household.name,
    });
    config = await getConfig();
    passwordEl.value = "";
    setLoginStatus("");
    showLoggedIn();
    setOptions(households, config.householdId);
  } catch (err) {
    setLoginStatus(err.message || "Login failed.", "error");
    loginBtn.disabled = false;
  }
});

saveHouseholdBtn.addEventListener("click", async () => {
  const householdId = householdEl.value ? Number(householdEl.value) : null;
  if (!householdId) return;
  const householdName = householdEl.options[householdEl.selectedIndex]?.text ?? "";
  await setConfig({ householdId, householdName });
  setStatus("Saved.", "ok");
});

logoutBtn.addEventListener("click", async () => {
  await logout();
  loggedIn.classList.add("hidden");
  loggedOut.classList.remove("hidden");
});

init();
