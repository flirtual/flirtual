import React from "react";
import { twMerge } from "tailwind-merge";

import { Footer, FooterProps } from "./footer";
import { Header } from "./header";
import { Navigation } from "./navigation";

export const SoleModelLayout: React.FC<React.ComponentProps<"div"> & { footer?: FooterProps }> = ({
	children,
	footer = {},
	...props
}) => (
	<div
		{...props}
		className={twMerge(
			"dark:text-brand-white flex min-h-screen grow flex-col items-center overflow-x-hidden bg-cream text-black-80 dark:bg-black-80 sm:flex-col",
			props.className
		)}
	>
		<Header />
		<div className="flex w-full max-w-screen-lg grow flex-col items-center sm:justify-center sm:py-32 md:px-8">
			{children}
		</div>
		<Footer {...footer} />
		<Navigation />
	</div>
);
