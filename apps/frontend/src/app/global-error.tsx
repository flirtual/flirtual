/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/button-has-type */
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Error from "next/error";

export default function GlobalError({
	error,
	reset
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	console.log("global error");

	return (
		<html>
			<body>
				<h2>Something went wrong!</h2>
				<button onClick={() => reset()}>Try again</button>
				<Error statusCode={undefined as any} />
			</body>
		</html>
	);
}
