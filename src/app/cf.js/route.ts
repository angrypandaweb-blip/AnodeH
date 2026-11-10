export const dynamic = "force-dynamic";

export function GET() {
  const source = `(function () {
  var el = document.currentScript;
  if (!el) return;
  var key = el.getAttribute("data-key") || "";
  var endpoint = new URL("/api/clicks", el.src).toString();
  var started = Date.now();
  var engaged = false;
  function mark() { engaged = true; }
  addEventListener("scroll", mark, { once: true, passive: true });
  addEventListener("pointerdown", mark, { once: true, passive: true });
  var sent = false;
  function send() {
    if (sent) return;
    sent = true;
    var params = new URLSearchParams(location.search);
    var payload = {
      key: key,
      clickId: params.get("gclid") || params.get("msclkid") || params.get("fbclid") || "",
      campaign: params.get("utm_campaign") || "",
      landing: location.href,
      timeOnPage: Math.round((Date.now() - started) / 1000),
      engaged: engaged,
      converted: false
    };
    var body = JSON.stringify(payload);
    if (!navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }))) {
      fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: body, keepalive: true });
    }
  }
  addEventListener("pagehide", send);
  setTimeout(send, 8000);
})();`;
  return new Response(source, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
