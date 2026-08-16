import { createContext } from "react";
import type { Tour } from "shepherd.js";

export const ShepherdContext = createContext<Tour | null>(null);
