"use client";

import * as Sentry from "@sentry/nextjs";
import type Error from "next/error";
import { Montserrat, Nunito } from "next/font/google";
import Link from "next/link";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";

import { Button } from "~/components/button";
import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";

import "~/css/index.css";

const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"]
});
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

const fontClassNames = twMerge(montserrat.variable, nunito.variable);

export default function GlobalError({
	error,
	reset
}: {
	error: { digest?: string } & Error;
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html>
			<body className={fontClassNames}>
				<div className="flex min-h-screen w-full justify-center bg-black-80 px-8 py-16 text-white-20 desktop:items-center">
					<div className="flex flex-col gap-8 desktop:justify-start">
						<div className="flex flex-col gap-8">
							<FlirtualLogo className="w-64" />
							<h1 className="font-montserrat text-2xl font-semibold desktop:text-3xl">
								There was an error loading Flirtual
							</h1>
							<div className="flex flex-col gap-4 font-nunito">
								<p>
									Please try refreshing or going back and trying again. If that doesn't work, try fully closing and reopening your app/browser.
									<br className="hidden desktop:block" />
									{" "}
									If this issue persists, please check your network connection or
									{" "}
									<Link
										className="text-white-10 underline"
										href={urls.resources.contact}
									>
										contact us
									</Link>
									{" "}
									and let us know the page or action you&apos;re seeing this on.
									<br className="hidden desktop:block" />
									{" "}
									Thank you for your patience &lt;3
								</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								className="w-fit"
								kind="secondary"
								size="sm"
								onClick={() => location.reload()}
							>
								Refresh
							</Button>
							<Button
								className="w-fit"
								kind="secondary"
								size="sm"
								onClick={() => history.back()}
							>
								Go back
							</Button>
						</div>
						<div className="mt-auto flex flex-col">
							<div>
								<Link className="underline" href={urls.resources.networkStatus}>
									Network Status
								</Link>
								{" • "}
								<Link className="underline" href={urls.socials.discord}>
									Discord
								</Link>
								{" • "}
								<Link className="underline" href={urls.socials.twitter}>
									Twitter
								</Link>
							</div>
							<footer>
								©
								{new Date().getFullYear()}
								{" "}
								Flirtual
							</footer>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
