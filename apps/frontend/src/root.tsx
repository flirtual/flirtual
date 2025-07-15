import type { PropsWithChildren } from "react";
import { I18nextProvider } from "react-i18next";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { ErrorDialog } from "./app/[locale]/(app)/error-dialog";
import { i18n } from "./i18n";

import "./app/index.css";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
	}
];

export function Layout({ children }: PropsWithChildren) {
	return (
		<html suppressHydrationWarning lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				<Meta />
				<Links />
			</head>
			<body
				suppressHydrationWarning
				className="flex min-h-screen flex-col bg-white-20 font-nunito text-black-80 antialiased data-[theme=dark]:bg-black-70 data-[vision]:bg-transparent data-[theme=dark]:text-white-20 desktop:bg-cream desktop:data-[theme=dark]:bg-black-80"
			>
				<I18nextProvider i18n={i18n}>
					{children}
				</I18nextProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details
      = error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	}
	else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return <ErrorDialog error={error} reset={() => location.reload()} />;
}
