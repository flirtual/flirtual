/* eslint-disable react-refresh/only-export-components */
import type { PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useLocation } from "react-router";
import type { To } from "react-router";

import { Navigate } from "./i18n";

const redirectSymbol = Symbol("redirect");
const redirectErrorMessage = "This error was thrown by throwRedirect() and must be caught by a redirect boundary.";

export function throwRedirect(to: To): never {
	const error = Object.assign(new Error(redirectErrorMessage), {
		[redirectSymbol]: true,
		to
	});

	throw error;
}

export function isRedirectError(error: unknown): error is { to: To } {
	return error instanceof Error && (error as any)[redirectSymbol] === true;
}

export function RedirectBoundary({ children }: PropsWithChildren) {
	const location = useLocation();

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => {
				if (!isRedirectError(error)) throw error;
				
				return <Navigate replace to={error.to} />;
			}}
			resetKeys={[location]}
		>
			{children}
		</ErrorBoundary>
	);
}
