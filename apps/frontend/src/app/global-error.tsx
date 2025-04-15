"use client";

import { twMerge } from "tailwind-merge";

import { maintenance } from "~/const";
import { urls } from "~/urls";

import type { ErrorProps } from "./[locale]/(app)/error-dialog";
import { LoadingIndicator } from "./[locale]/(app)/loading-indicator";
import { fontClassNames } from "./fonts";

import "./index.css";

// eslint-disable-next-line unused-imports/no-unused-vars
export default function GlobalError(props: ErrorProps) {
	return (
		<html>
			<body className={twMerge(fontClassNames, "flex min-h-screen grow flex-col items-center bg-white-20 p-4 text-center font-nunito text-black-80 vision:bg-transparent dark:bg-black-70 dark:text-white-20 desktop:flex-col desktop:bg-cream desktop:dark:bg-black-80",)}>
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
										<a className="text-theme-2" href={urls.socials.discord}>
											Discord Community
										</a>
										{" ⋅ "}
										<a className="text-theme-2" href={urls.resources.contact}>
											Contact Support
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
										<a className="text-theme-2" href={urls.socials.discord}>
											Discord Community
										</a>
										{" ⋅ "}
										<a className="text-theme-2" href={urls.resources.contact}>
											Contact Support
										</a>
									</div>
								</>
							)}
				</LoadingIndicator>
			</body>
		</html>
	);
}
