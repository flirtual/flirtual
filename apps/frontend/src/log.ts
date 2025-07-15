import { debug, enable } from "debug";

import * as environment from "./const";

if (environment.development) enable("*");
if (environment.client) debug.selectColor = () => "pink";

export const log = debug("app");
export const logRendering = log.extend("rendering");


if (environment.client) log.extend("environment")({ ...environment });
