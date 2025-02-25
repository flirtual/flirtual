"use client";

import { Montserrat, Nunito } from "next/font/google";
import { twMerge } from "tailwind-merge";

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
	return (
		<html>
			<body className={twMerge(fontClassNames, "flex min-h-screen grow flex-col items-center bg-white-20 font-nunito text-black-80 vision:bg-transparent dark:bg-black-70 dark:text-white-20 desktop:flex-col desktop:bg-cream desktop:dark:bg-black-80",)}>
				<LoadingIndicator>
					<span>Welp, something went wrong.</span>
					<div className="flex gap-2 text-center">
						<span className="cursor-pointer text-theme-2" onClick={() => location.reload()}>
							Try again
						</span>
						{" ⋅ "}
						<a className="text-theme-2" href={urls.resources.contact}>
							Contact support
						</a>
					</div>
				</LoadingIndicator>
			</body>
		</html>
	);
}
