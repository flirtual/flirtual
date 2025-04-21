"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { PropsWithChildren } from "react";

import { queryClient } from "~/query";

export default function RootLayout({ children }: PropsWithChildren) {
	return (
		<QueryClientProvider client={queryClient}>
			<ReactQueryDevtools />
			{children}
		</QueryClientProvider>
	);
}
