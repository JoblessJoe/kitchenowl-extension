# Recipe Importer for KitchenOwl (unofficial)

A small Firefox extension that saves the recipe on the page you're viewing straight
into your self-hosted [KitchenOwl](https://kitchenowl.org) instance — log in once,
then it's one click on any recipe page.

> **Unofficial.** Not affiliated with or endorsed by the KitchenOwl project. It talks
> to KitchenOwl's HTTP API from your browser; nothing is proxied through any
> third-party server.

## What it does

1. **Log in once** to your KitchenOwl server (address + username + password). The
   extension exchanges your login for a long-lived token and stores it locally, so you
   stay logged in across sessions and reboots. Your password is never stored.
2. On any recipe page, click the toolbar button and hit **Save this recipe**.
3. KitchenOwl's own scraper page opens in a new tab with the recipe already parsed —
   review the ingredients and save it there.

Handing off to KitchenOwl's scraper page (rather than creating the recipe blindly via
the API) is deliberate: it lets KitchenOwl match ingredients to items you already have
and lets you review before saving, so nothing gets dropped or mangled.

The small **gear** icon (top-right of the popup) opens settings, where you can switch
household or log out.

## Works with plain-HTTP servers on your LAN

Most people self-host KitchenOwl over plain `http://` on their home network. Firefox
tries hard to upgrade extension requests to HTTPS, which breaks against an HTTP-only
server. This extension handles that for you — no `about:config`, no HTTPS-Only
exceptions, nothing to change in your browser. Just enter your `http://…` address and
log in.

## Install

Until it's published on Firefox Add-ons, you can run it locally:

1. Clone this repo.
2. In Firefox, open `about:debugging#/runtime/this-firefox`.
3. **Load Temporary Add-on…** and pick `manifest.json`.

(Temporary add-ons are removed when Firefox restarts. For a permanent install you'll
need a signed build — see Development below.)

## Development

```bash
npm install
npm run lint    # web-ext lint (same checks Firefox Add-ons runs) — no browser needed
npm run dev     # launches a Firefox instance with the extension loaded + live reload
npm run build   # produces a zip in web-ext-artifacts/ ready for signing/publishing
```

`npm run dev` needs a desktop Firefox and a display. On a headless machine, use
`npm run build` and load the result via `about:debugging` on a machine with a GUI.

### How it's put together

```
manifest.json          MV3 (Firefox), static host permissions, points at the pieces below
src/
  background.js        the only place that talks to the KitchenOwl API (login, households)
  lib/
    kitchenowl.js      small page-side helpers + a message wrapper to the background
    storage.js         reads/writes config in browser.storage.local
  popup/               the toolbar popup: log-in prompt + the big "Save this recipe" button
  options/             the settings tab: log in, pick household, log out
icons/                 the extension icon
```

A couple of Firefox specifics worth knowing if you hack on it:

- **All network requests live in `background.js`.** In Firefox MV3, only the background
  script gets the cross-origin (CORS-bypass) privilege from a host permission — a
  `fetch` from the popup or options page is still blocked by CORS. The pages send a
  message; the background does the fetch and returns the result.
- **Host access is a static `host_permissions`** (`http://*/*`, `https://*/*`) rather
  than a runtime-granted optional permission, because a runtime-granted host permission
  does not get added to Firefox's CORS-bypass list. The extension only ever contacts the
  server address you configure.

## Contributing

Contributions are very welcome — please do check out the code and hack on it. Whether
it's a bug fix, a rough edge in the UI, better error handling, Chrome/Chromium support,
or an idea for a nicer flow, feel free to open an issue or a pull request. It's a small,
approachable codebase (plain JavaScript, no build step for the extension itself), so
it's a friendly place to poke around, and questions via issues are just as welcome as
code.

## Permissions

- `storage` — save your login and settings locally.
- `activeTab` — read the URL of the tab you're on when you click the button.
- `host_permissions` (`http://*/*`, `https://*/*`) — so the extension can reach whatever
  self-hosted server address you enter. It only ever contacts that server.

Your server address and token live only in this browser (`browser.storage.local`) and
are sent only to your own server.

## Contributors

- Johannes Tebbert

## License

MIT — see [LICENSE](LICENSE). This extension is independent software and does not include
any KitchenOwl (AGPL-3.0) source code; it only talks to KitchenOwl's HTTP API over the
network.
