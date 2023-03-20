"use client";

import * as swr from "swr";

export const SWRConfig = ((props) => {
	return <swr.SWRConfig {...props}>{props.children}</swr.SWRConfig>;
}) as typeof swr.SWRConfig;
