import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense, useEffect } from "react";
import type { FC } from "react";

import { setSlowRequests } from "~/api/common";
import { development } from "~/const";
import { useOptionalSession } from "~/hooks/use-session";
import { queryClient } from "~/query";

import { InsetPreview } from "./inset-preview";

const DebuggerTools: FC = () => {
	useEffect(() => {
		setSlowRequests(true);
		return () => setSlowRequests(false);
	}, []);

	return (
		<>
			<InsetPreview />
			<ReactQueryDevtools client={queryClient} />
		</>
	);
};

const DebuggerOnly: FC = () => {
	const session = useOptionalSession();
	if (!session?.user.tags?.includes("debugger")) return null;

	return <DebuggerTools />;
};

export const DebugTools: FC = () => development && (
	<Suspense fallback={null}>
		<DebuggerOnly />
	</Suspense>
);
