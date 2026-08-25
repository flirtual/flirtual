const APP_SCHEME = "flirtual";
const APPLE_APP_ID = "997W5KLYVR.zone.homie.flirtual.pwa";
const ANDROID_PACKAGE = "zone.homie.flirtual.pwa";
const ANDROID_SHA256 = [
  "E8:A1:BC:8D:DD:4E:C5:2B:55:39:A0:1B:29:A4:48:32:6A:F0:43:7B:CF:39:7E:4A:65:48:6F:3F:28:6C:BB:CD",
  "DB:80:DC:6B:46:52:7F:AF:33:26:BA:3B:EC:6B:02:72:BC:13:6A:09:64:D4:92:A1:B7:4D:13:42:A3:62:29:74",
  "D8:88:1F:A0:B2:E2:91:4C:A1:94:F4:2D:7F:E0:89:D9:FA:E7:0F:83:77:D7:DC:15:6C:C4:E3:17:3B:F6:CE:5B",
  "7B:B2:77:FE:7C:FF:D4:98:6D:97:92:04:A7:05:05:80:4C:CE:34:A3:BD:F4:7B:79:45:58:D9:5B:96:CE:7D:21",
];

const STORE = {
  apple:    "https://apps.apple.com/app/flirtual-vr-dating-app/id6450485324",
  android:  "https://play.google.com/store/apps/details?id=zone.homie.flirtual.pwa",
  // quest: "https://www.meta.com/experiences/XXXXXXXXXX/",
  // pico:  "https://store-global.picoxr.com/global/detail/1/XXX",
  download: "https://flirtual.com/download",
};

const APPLE_APP = STORE.apple.replace(/^https:\/\//, "itms-apps://");
const PLAY_APP = STORE.android.replace(
  /^https:\/\/play\.google\.com\/store\/apps\/details/,
  "market://details"
);

const EXPLICIT = ["/apple", "/ios", "/android", "/quest", "/pico", "/dl", "/download"];

export default {
  fetch(request) {
    const url = new URL(request.url);

    if (url.hostname !== "flirtual.app") {
      url.hostname = "flirtual.app";
      return new Response(null, {
        status: 301,
        headers: { location: url.toString(), "cache-control": "public, max-age=86400" },
      });
    }

    const path = url.pathname.replace(/\/+$/, "").toLowerCase();

    if (path === "/.well-known/apple-app-site-association") {
      return json({
        applinks: {
          details: [
            {
              appIDs: [APPLE_APP_ID],
              components: [
                ...EXPLICIT.map((p) => ({ "/": p, exclude: true })),
                { "/": "/.well-known/*", exclude: true },
                { "/": "/*" },
              ],
            },
          ],
        },
      });
    }

    if (path === "/.well-known/assetlinks.json") {
      return json([
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: ANDROID_PACKAGE,
            sha256_cert_fingerprints: ANDROID_SHA256,
          },
        },
      ]);
    }

    switch (path) {
      case "/apple":    return redirect(APPLE_APP);
      case "/ios":      return redirect(APPLE_APP);
      case "/android":  return redirect(PLAY_APP);
      // case "/quest": return redirect(STORE.quest);
      // case "/pico":  return redirect(STORE.pico);
      case "/dl":       return redirect(STORE.download);
      case "/download": return redirect(STORE.download);
    }

    const ua = request.headers.get("user-agent") || "";

    // Order matters: Pico UA includes OculusBrowser and both include Android.
    // if (/PicoBrowser|Pico /i.test(ua))   return redirect(STORE.pico);
    // if (/OculusBrowser|Quest/i.test(ua)) return redirect(STORE.quest);

    if (/Android/i.test(ua)) {
      const rest = url.pathname.replace(/^\//, "") + url.search;
      return redirect(
        `intent://${rest}#Intent;scheme=${APP_SCHEME};package=${ANDROID_PACKAGE};` +
          `S.browser_fallback_url=${encodeURIComponent(STORE.android)};end`
      );
    }

    if (/iPhone|iPod|iPad/i.test(ua)) return redirect(APPLE_APP);

    if (/Macintosh/i.test(ua)) return appleInterstitial();

    return redirect(STORE.download);
  },
};

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: { location, "cache-control": "no-store" },
  });
}

function json(body) {
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600",
    },
  });
}

// iPadOS and visionOS Safari report Mac UAs. Open the App Store then redirect
// to the download page in case macOS users want a different app.
function appleInterstitial() {
  const html =
    `<!doctype html><meta charset=utf-8>` +
    `<meta name=viewport content="width=device-width,initial-scale=1">` +
    `<title>Flirtual</title>` +
    `<script>(function(){` +
    `try{window.location.href=${JSON.stringify(APPLE_APP)};}catch(e){}` +
    `setTimeout(function(){window.location.replace(${JSON.stringify(STORE.download)});},700);` +
    `})();<\/script>` +
    `<noscript><meta http-equiv=refresh content="0;url=${STORE.download}"></noscript>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
