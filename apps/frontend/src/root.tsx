import type { PropsWithChildren } from "react";
import { I18nextProvider } from "react-i18next";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { ErrorDialog } from "./app/[locale]/(app)/error-dialog";
import { i18n } from "./i18n";

import "@fontsource-variable/montserrat";
import "@fontsource-variable/nunito";
import "./app/index.css";
import { LoadingIndicator } from "./components/loading-indicator";

export const links: Route.LinksFunction = () => [];

export async function loader({ params: { locale } }: Route.LoaderArgs) {
	return { locale };
}

export function Layout({ children }: PropsWithChildren) {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const { locale } = useLoaderData<typeof loader>();
	// await i18n.changeLanguage(locale);

	return (
		<html suppressHydrationWarning lang={locale}>
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

export function HydrateFallback() {
  return <LoadingIndicator/>
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	return <ErrorDialog error={error as any} reset={() => location.reload()} />;
}
