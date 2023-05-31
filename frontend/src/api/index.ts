export * as api from "./exports";
export * from "./exports";

import * as api from "./exports";

// @ts-expect-error: expose "api" for repl usage.
globalThis.api = api;
