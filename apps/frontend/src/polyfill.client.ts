// See baseline targets in `./polyfill.ts` — these are used for both polyfilling and Vite's build target.

// Array.prototype.at — Safari 15.0–15.3 lacks it (added in 15.4).
import "core-js/actual/array/at";
// Array.prototype.toReversed — missing in every target (chrome 110+ / fx 115+ / safari 16+).
import "core-js/actual/array/to-reversed";
// Object.hasOwn — Safari 15.0–15.3 lacks it (added in 15.4).
import "core-js/actual/object/has-own";
// AbortSignal.any (chrome 116 / fx 124 / safari 17.4) + AbortSignal.timeout (safari 16).
import "@shgysk8zer0/polyfills/abort";
// CookieStore — no native support in Firefox or Safari.
import "@shgysk8zer0/polyfills/cookieStore";
// HTMLFormElement.prototype.requestSubmit.
import "@shgysk8zer0/polyfills/element";
