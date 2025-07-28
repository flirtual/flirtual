import debug from "debug";

import * as environment from "./const";

const prefix = "flirtual";
if (environment.development) debug.enable(`${prefix}*`);
if (environment.client) debug.selectColor = () => "pink";

export const log = debug(prefix);
export const logRendering = log.extend("rendering");

if (environment.client) log.extend("environment")({ ...environment });
