// This file is a hack to make SWR work with Next.js' SSR,
// since SWR hasn't adopted the "use client" pattern, we need to do it ourselves.
"use client";

import * as swr from "~/swr";

export const SWRConfig = (({ children, ...props }) => {
	return <swr.SWRConfig {...props}>{children}</swr.SWRConfig>;
}) as typeof swr.SWRConfig;
