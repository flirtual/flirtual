// This file is a hack to make SWR work with Next.js' SSR,
// since SWR hasn't adopted the "use client" pattern, we need to do it ourselves.
"use client";

import * as swr from "swr";
import * as swrInfinite from "swr/infinite";

export const SWRConfig = ((props) => {
	return <swr.SWRConfig {...props}>{props.children}</swr.SWRConfig>;
}) as typeof swr.SWRConfig;

export const unstableSerialize = swr.unstable_serialize;
export const unstableInfiniteSerialize = swrInfinite.unstable_serialize;
