# Firefox Add-ons (AMO) submission materials

Ready-to-paste copy for the addons.mozilla.org listing. Not shipped in the package
(all `.md` files are excluded from the build).

---

## Summary (short description, max ~250 characters)

Save the recipe on any web page straight into your self-hosted KitchenOwl. Log in once
to your server, then click "Save this recipe" on a recipe page and review it in
KitchenOwl. Unofficial; works with plain-HTTP servers on your home network.

---

## Description (full listing text)

Recipe Importer for KitchenOwl lets you send the recipe you're looking at straight into
your own self-hosted KitchenOwl instance.

How it works:

- Log in once to your KitchenOwl server (address, username, password). The extension
  keeps you signed in with a long-lived token stored locally on your device — your
  password is never stored.
- On any recipe page, click the toolbar button and hit "Save this recipe".
- KitchenOwl's own scraper page opens with the recipe already parsed, so you can review
  the ingredients and save it there.

It works with plain-HTTP servers on your home network with no browser changes required,
and it only ever talks to the server address you configure — nothing is sent to any
third party.

This is an unofficial extension and is not affiliated with or endorsed by the KitchenOwl
project.

Open source (MIT): https://github.com/JoblessJoe/kitchenowl-extension

Suggested category: Shopping
Suggested tags/keywords: kitchenowl, recipe, self-hosted, groceries, import

---

## Notes for reviewers

This is an unofficial companion extension for KitchenOwl, an open-source self-hosted
recipe and grocery manager. It lets a logged-in user save the recipe on the current page
into their own KitchenOwl instance.

Testing:

- KitchenOwl is a self-hosted service, so it needs a running KitchenOwl server to test
  against. It self-hosts in a couple of minutes with the official install guide:
  https://docs.kitchenowl.org/latest/self-hosting/ (Docker).
- Once a server is running, in the extension open Settings ("Set up KitchenOwl"), enter
  the server address plus your username and password, and log in. Open any recipe page
  (for example on allrecipes.com or chefkoch.de), click the toolbar button, then "Save
  this recipe". A KitchenOwl tab opens on its scraper/review page for that URL.
- If it is easier, I am happy to provide temporary credentials to a live KitchenOwl
  instance for the review — please just request them via the developer contact and I
  will supply a URL and login.

Why the broad host permission (http://*/*, https://*/*):

- The server is user-provided and can be any origin: a LAN IP with an arbitrary port, or
  a custom domain. It cannot be known in advance, so the host permission cannot be scoped
  more narrowly. The extension only ever makes requests to the single server address the
  user configures.

Why network requests run in the background script:

- In Firefox MV3, only the background script receives the cross-origin (CORS-bypass)
  privilege from a host permission; requests from the popup/options page are blocked by
  CORS. The pages message the background script, which performs the fetch.

Code:

- All code is plain, unminified JavaScript with no build or bundle step. What is in the
  repository is exactly what is in the package. Source:
  https://github.com/JoblessJoe/kitchenowl-extension

Naming / trademark:

- The add-on is labelled "unofficial" and is not affiliated with or endorsed by the
  KitchenOwl project; the name is used nominatively to describe compatibility.

Data:

- No data is collected by the developer. The extension stores settings locally and
  communicates only with the user's own server. See the privacy policy:
  https://github.com/JoblessJoe/kitchenowl-extension/blob/main/PRIVACY.md
