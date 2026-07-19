# Recipe Importer for KitchenOwl (unofficial)

A tiny Firefox extension that saves the recipe on the page you're viewing
straight into your self-hosted [KitchenOwl](https://kitchenowl.org) instance —
one click, one big button.

> Unofficial. Not affiliated with or endorsed by the KitchenOwl project. It
> talks to KitchenOwl's HTTP API from your browser; nothing is proxied through
> any third-party server.

## How it works

1. **Log in once** to your KitchenOwl server (address + username + password).
   The extension exchanges your login for a **long-lived token** and stores it
   locally, so you stay logged in across sessions and reboots.
2. On any recipe page, click the toolbar button and hit the big
   **“Save this recipe”** button.
3. KitchenOwl scrapes the page, the recipe is added to your household, and a
   tab opens on your KitchenOwl server for any further editing.

The small **gear** (top-right) opens settings: switch household or log out.

Your server address and token live only in this browser
(`browser.storage.local`) and are sent only to your own server.

## Development

```bash
npm install
npm run lint    # web-ext lint (same checks AMO runs) — no browser needed
npm run build   # produces a zip in web-ext-artifacts/ for AMO
npm run dev     # launches a local Firefox with the extension loaded
```

`npm run dev` needs a real Firefox binary and a display. On a headless server
use `npm run build`, then load the extension on a desktop Firefox via
`about:debugging` → **This Firefox** → **Load Temporary Add-on** →
pick `manifest.json`.

## Publishing to Firefox Add-ons (AMO)

1. Log in to a Mozilla Account on
   [addons.mozilla.org](https://addons.mozilla.org) (no developer fee).
2. `npm run build` and upload the zip from `web-ext-artifacts/`.
3. Provide a description, category, support contact, license, a **privacy
   policy** (the extension sends your server address + token to your own
   server), and **reviewer notes** explaining the server is self-hosted so
   reviewers can't reach an arbitrary instance.

## Permissions

- `storage` — save your login/settings.
- `activeTab` — read the URL of the tab you're on when you click the button.
- Host access is requested **at runtime** for your specific server origin only
  (never `<all_urls>`).

## Contributors

- Johannes Tebbert

## License

MIT — see [LICENSE](LICENSE). This extension is independent software and does
not include any KitchenOwl (AGPL-3.0) source code.
