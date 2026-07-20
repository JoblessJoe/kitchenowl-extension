# Privacy Policy — Recipe Importer for KitchenOwl (unofficial)

_Last updated: 2026-07-20_

This extension is built to keep your data on your own devices and your own server. It
has no backend of its own, and the developer does not collect, receive, or have access
to any of your data.

## What the extension stores

To work, the extension saves the following **on your device only**, using the browser's
local extension storage (`browser.storage.local`):

- The address of your KitchenOwl server
- Your KitchenOwl username
- A long-lived access token issued by your KitchenOwl server
- Your selected household (id and name)

Your **password is used only once**, at login, to obtain the access token from your
server. It is never stored.

This information stays in your browser. It is removed when you log out in the extension
or uninstall the extension.

## What the extension sends, and to whom

The extension communicates **only with the KitchenOwl server address you configure**. It
sends:

- Your login (once) to obtain a token, and that token on subsequent requests, in order
  to authenticate to your server.
- When you click **Save this recipe**, it opens your KitchenOwl server's recipe scraper
  page for the current tab's URL, so your server can fetch and parse that recipe. This
  means the URL of the page you choose to save is sent to your own KitchenOwl server.

No data is sent to the developer or to any third party. There is no analytics, no
tracking, and no telemetry.

## Permissions

- `storage` — to save the settings listed above on your device.
- `activeTab` — to read the URL of the current tab when you click the button.
- Host access (`http` and `https`) — so the extension can reach the self-hosted server
  address you enter. It only ever contacts that server.

## Changes

If this policy changes, the updated version will be published in the extension's
repository.

## Contact

Questions or issues: <https://github.com/JoblessJoe/kitchenowl-extension/issues>
