import { getConfig, isLoggedIn } from "../lib/storage.js";
import { api, apiBase } from "../lib/kitchenowl.js";

const gear = document.getElementById("gear");
const loginView = document.getElementById("login-view");
const actionView = document.getElementById("action-view");

const setupBtn = document.getElementById("setup-btn");

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

// --- Setup ---------------------------------------------------------------

// Login lives on the options page (a full tab) because Firefox can't show the
// host-permission prompt reliably over this popup.
setupBtn.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
  window.close();
});

// --- Save recipe ---------------------------------------------------------

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  setStatus(actionStatus, "Scraping recipe…", "busy");
  try {
    const scraped = await api("scrape", { cfg: config, pageUrl: currentUrl });
    if (!scraped || !scraped.name) {
      setStatus(actionStatus, "No recipe could be found on this page.", "error");
      saveBtn.disabled = false;
      return;
    }

    setStatus(actionStatus, `Saving “${scraped.name}”…`, "busy");
    await api("addRecipe", { cfg: config, recipe: scraped });

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
