"use client";

import { useCurrentUser } from "~/hooks/use-session";

import type { ErrorProps } from "../error-dialog";
import { ErrorDialog } from "../error-dialog";
import { LoadingIndicator } from "./loading-indicator";

export default function AppError(props: ErrorProps) {
	const user = useCurrentUser();

	return (
		<>
			<LoadingIndicator />
			<ErrorDialog {...props} userId={user?.id} />
		</>
	);
}
