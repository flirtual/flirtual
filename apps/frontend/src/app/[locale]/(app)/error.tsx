"use client";

import { useOptionalSession } from "~/hooks/use-session";

import type { ErrorProps } from "./error-dialog";
import { ErrorDialog } from "./error-dialog";
import { LoadingIndicator } from "./loading-indicator";

export default function AppError(props: ErrorProps) {
	const session = useOptionalSession();

	return (
		<>
			<LoadingIndicator className="absolute inset-0 h-screen" />
			<ErrorDialog {...props} userId={session?.user?.id} />
		</>
	);
}
