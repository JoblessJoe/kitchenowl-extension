// Keep the extension's own calls on plain HTTP for a self-hosted server.
//
// Firefox's HTTPS-First (on by default, no Settings-UI toggle) silently
// upgrades http:// requests to https://. For a normal page load it falls back
// to http when https fails, but for an extension's fetch() it does NOT fall
// back — so a LAN server that only serves HTTP (the common self-hosted case)
// becomes unreachable with a TLS error.
//
// Per the webRequest docs, if a blocking onBeforeRequest listener returns a
// redirectUrl, Firefox skips the "upgrade to secure" for that request. So we
// watch for an upgraded https:// request aimed at the *user's configured
// server only* and rewrite it back to http://. We never touch any other host.

let activeHost = null; // "host:port" we currently intercept, or null
let listener = null;

function downgradeToHttp(details) {
  const url = new URL(details.url);
  if (url.protocol === "https:") {
    url.protocol = "http:";
    return { redirectUrl: url.toString() };
  }
  return {};
}

function stop() {
  if (listener) {
    browser.webRequest.onBeforeRequest.removeListener(listener);
    listener = null;
  }
  activeHost = null;
}

function start(host) {
  stop();
  listener = downgradeToHttp;
  browser.webRequest.onBeforeRequest.addListener(
    listener,
    // Catch the upgraded request (https) and, defensively, the http one too —
    // both scoped to just this one host, never all sites.
    { urls: [`https://${host}/*`, `http://${host}/*`] },
    ["blocking"]
  );
  activeHost = host;
}

// Turn interception on only when the saved server is a plain-http address that
// we actually have permission for; otherwise leave the network untouched.
async function sync() {
  let host = null;
  try {
    const { serverUrl } = await browser.storage.local.get("serverUrl");
    if (serverUrl && serverUrl.startsWith("http://")) {
      host = new URL(serverUrl).host;
      const granted = await browser.permissions.contains({
        origins: [`http://${host}/*`, `https://${host}/*`],
      });
      if (!granted) host = null;
    }
  } catch (e) {
    host = null;
  }

  if (host === activeHost) return;
  if (host) start(host);
  else stop();
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.serverUrl) sync();
});
browser.permissions.onAdded.addListener(sync);
browser.permissions.onRemoved.addListener(sync);

sync();
