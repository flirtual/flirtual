// See baseline targets in `./targets.ts` — these are used for both polyfilling and Vite's build target.

// Array.prototype.toReversed — missing in every target (chrome 110+ / fx 115+ / safari 16+).
import "core-js/actual/array/to-reversed";
// AbortSignal.any (chrome 116 / fx 124 / safari 17.4) + AbortSignal.timeout (safari 16).
import "@shgysk8zer0/polyfills/abort";
// CookieStore — no native support in Firefox or Safari.
import "@shgysk8zer0/polyfills/cookieStore";
// HTMLFormElement.prototype.requestSubmit.
import "@shgysk8zer0/polyfills/element";
