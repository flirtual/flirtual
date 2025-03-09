"use client";

import { Montserrat, Nunito } from "next/font/google";
import { twMerge } from "tailwind-merge";

// import { maintenance } from "~/const";
import { urls } from "~/urls";

import { LoadingIndicator } from "./(app)/loading-indicator";
import type { ErrorProps } from "./error-dialog";

import "~/css/index.css";

const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"]
});
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

const fontClassNames = twMerge(montserrat.variable, nunito.variable);

// eslint-disable-next-line unused-imports/no-unused-vars
export default function GlobalError(props: ErrorProps) {
	const maintenance = true;

	return (
		<html>
			<body className={twMerge(fontClassNames, "flex min-h-screen grow flex-col items-center bg-white-20 font-nunito text-black-80 vision:bg-transparent dark:bg-black-70 dark:text-white-20 desktop:flex-col desktop:bg-cream desktop:dark:bg-black-80",)}>
				<LoadingIndicator>
					{maintenance
						? (
								<>
									<h1 className="mb-2 text-xl">Flirtual is temporarily offline for scheduled maintenance.</h1>
									<span>We're upgrading some things, but we'll be right back&mdash;check back soon!</span>
									<div className="mt-2 flex gap-2 text-center">
										<span className="cursor-pointer text-theme-2" onClick={() => location.reload()}>
											Refresh
										</span>
										{" ⋅ "}
										<a className="text-theme-2" href={urls.landing}>
											Home
										</a>
										{" ⋅ "}
										<a className="text-theme-2" href={urls.socials.discord}>
											Discord community
										</a>
										{" ⋅ "}
										<a className="text-theme-2" href={urls.resources.contact}>
											Contact support
										</a>
									</div>
								</>
							)
						: (
								<>
									<h1>Something went wrong!</h1>
									<span>Please try again later or contact us if this error persists.</span>
									<div className="flex gap-2 text-center">
										<span className="cursor-pointer text-theme-2" onClick={() => location.reload()}>
											Try again
										</span>
										{" ⋅ "}
										<a className="text-theme-2" href={urls.landing}>
											Home
										</a>
										{" ⋅ "}
										<a className="text-theme-2" href={urls.socials.discord}>
											Discord community
										</a>
										{" ⋅ "}
										<a className="text-theme-2" href={urls.resources.contact}>
											Contact support
										</a>
									</div>
								</>
							)}
				</LoadingIndicator>
			</body>
		</html>
	);
}
