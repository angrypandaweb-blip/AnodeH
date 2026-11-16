export const dynamic = "force-dynamic";

export function GET() {
  const source = `(function () {
  var el = document.currentScript;
  if (!el) return;
  var key = el.getAttribute("data-key") || "";
  var blockUrl = el.getAttribute("data-block-url") || "https://anodeh.com/blocked";
  var endpoint = new URL("/api/clicks", el.src).toString();
  var started = Date.now();
  var engaged = false;
  function mark() { engaged = true; }
  addEventListener("scroll", mark, { once: true, passive: true });
  addEventListener("pointerdown", mark, { once: true, passive: true });
  var sent = false;
  function payload() {
    var params = new URLSearchParams(location.search);
    return JSON.stringify({
      key: key,
      clickId: params.get("gclid") || params.get("gbraid") || params.get("wbraid") || params.get("msclkid") || params.get("fbclid") || "",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
      landing: location.href,
      timeOnPage: Math.round((Date.now() - started) / 1000),
      engaged: engaged,
      converted: false
    });
  }
  function onAnodeh() {
    return location.hostname === "anodeh.com" || location.hostname === "www.anodeh.com";
  }
  function send(redirectIfBlocked) {
    if (sent) return;
    sent = true;
    var body = payload();
    var plain = new Blob([body], { type: "text/plain;charset=UTF-8" });
    if (!redirectIfBlocked || onAnodeh()) {
      if (!navigator.sendBeacon(endpoint, plain)) {
        fetch(endpoint, { method: "POST", headers: { "content-type": "text/plain;charset=UTF-8" }, body: body, keepalive: true });
      }
      return;
    }
    fetch(endpoint, { method: "POST", headers: { "content-type": "text/plain;charset=UTF-8" }, body: body, keepalive: true })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.action === "block") location.replace(blockUrl);
      })
      .catch(function () {});
  }
  addEventListener("pagehide", function () { send(false); });
  setTimeout(function () { send(true); }, 8000);
})();`;
  return new Response(source, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
