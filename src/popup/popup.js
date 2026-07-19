import { getConfig, setConfig, isLoggedIn } from "../lib/storage.js";
import {
  ensureHostPermission,
  loginAndGetToken,
  listHouseholds,
  scrapeRecipe,
  addRecipe,
  apiBase,
} from "../lib/kitchenowl.js";

const gear = document.getElementById("gear");
const loginView = document.getElementById("login-view");
const actionView = document.getElementById("action-view");

const loginForm = document.getElementById("login-form");
const serverEl = document.getElementById("server");
const usernameEl = document.getElementById("username");
const passwordEl = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginStatus = document.getElementById("login-status");

const pageUrlEl = document.getElementById("page-url");
const saveBtn = document.getElementById("save-btn");
const actionStatus = document.getElementById("action-status");

let config = null;
let currentUrl = null;

function setStatus(el, text, kind = "") {
  el.textContent = text;
  el.className = `status ${kind}`;
}

function show(view) {
  loginView.classList.toggle("hidden", view !== "login");
  actionView.classList.toggle("hidden", view !== "action");
}

async function getActiveTabUrl() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.url ?? null;
}

async function init() {
  config = await getConfig();
  if (config.serverUrl) serverEl.value = config.serverUrl;

  if (isLoggedIn(config)) {
    await initActionView();
  } else {
    show("login");
  }
}

async function initActionView() {
  show("action");
  currentUrl = await getActiveTabUrl();
  if (currentUrl) {
    pageUrlEl.textContent = currentUrl;
    pageUrlEl.title = currentUrl;
  }
  if (currentUrl && /^https?:/i.test(currentUrl)) {
    saveBtn.disabled = false;
    setStatus(actionStatus, "", "");
  } else {
    setStatus(actionStatus, "This page can't be saved (not a normal web page).");
  }
}

// --- Login ---------------------------------------------------------------

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const serverUrl = serverEl.value.trim();
  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  loginBtn.disabled = true;
  setStatus(loginStatus, "Connecting…", "busy");
  try {
    const granted = await ensureHostPermission(serverUrl);
    if (!granted) {
      setStatus(loginStatus, "Permission for your server was denied.", "error");
      loginBtn.disabled = false;
      return;
    }

    setStatus(loginStatus, "Logging in…", "busy");
    const { token } = await loginAndGetToken({ serverUrl, username, password });

    const households = await listHouseholds({ serverUrl, token });
    if (!households?.length) {
      setStatus(loginStatus, "No households found on this account.", "error");
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
    await initActionView();
  } catch (err) {
    setStatus(loginStatus, err.message || "Login failed.", "error");
    loginBtn.disabled = false;
  }
});

// --- Save recipe ---------------------------------------------------------

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  setStatus(actionStatus, "Scraping recipe…", "busy");
  try {
    const scraped = await scrapeRecipe(config, currentUrl);
    if (!scraped || !scraped.name) {
      setStatus(actionStatus, "No recipe could be found on this page.", "error");
      saveBtn.disabled = false;
      return;
    }

    setStatus(actionStatus, `Saving “${scraped.name}”…`, "busy");
    await addRecipe(config, scraped);

    setStatus(actionStatus, `Saved “${scraped.name}”. Opening KitchenOwl…`, "ok");
    await browser.tabs.create({ url: apiBase(config.serverUrl) });
    window.close();
  } catch (err) {
    setStatus(actionStatus, err.message || "Could not save the recipe.", "error");
    saveBtn.disabled = false;
  }
});

gear.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
  window.close();
});

init();
