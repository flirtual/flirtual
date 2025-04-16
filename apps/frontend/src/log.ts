import { debug, enable } from "debug";

import * as environment from "./const";

if (environment.development) enable("*");
if (environment.client) debug.selectColor = () => "pink";

export const log = debug("app");

log.extend("environment")({ ...environment });
