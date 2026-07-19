import { getConfig, setConfig, isLoggedIn, logout } from "../lib/storage.js";
import { listHouseholds } from "../lib/kitchenowl.js";

const loggedOut = document.getElementById("logged-out");
const loggedIn = document.getElementById("logged-in");
const accServer = document.getElementById("acc-server");
const accUser = document.getElementById("acc-user");
const householdEl = document.getElementById("household");
const saveHouseholdBtn = document.getElementById("save-household");
const logoutBtn = document.getElementById("logout");
const statusEl = document.getElementById("status");

let config = null;

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = `status ${kind}`;
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
  if (!isLoggedIn(config)) {
    loggedOut.classList.remove("hidden");
    return;
  }
  loggedIn.classList.remove("hidden");
  accServer.textContent = config.serverUrl;
  accUser.textContent = config.username || "—";

  // Show the saved household immediately, then refresh the full list.
  setOptions(
    [{ id: config.householdId, name: config.householdName || "Saved household" }],
    config.householdId
  );
  try {
    const households = await listHouseholds(config);
    if (households?.length) setOptions(households, config.householdId);
  } catch (e) {
    setStatus(`Couldn't refresh households: ${e.message}`, "error");
  }
}

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
