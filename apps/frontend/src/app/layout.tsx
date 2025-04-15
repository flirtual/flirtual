"use client";

import type { PropsWithChildren } from "react";

import { cacheMap, SWRConfig } from "~/swr";

export default function RootLayout({ children }: PropsWithChildren) {
	return (
		<>
			<SWRConfig value={{ /* provider: () => cacheMap */ }}>
				{children}
			</SWRConfig>
		</>
	);
}
