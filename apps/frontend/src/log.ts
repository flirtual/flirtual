import { createDebug } from "obug";

import { production } from "./const";

export const log = createDebug("flirtual", { useColors: true });
if (!production) log.enabled = true;
