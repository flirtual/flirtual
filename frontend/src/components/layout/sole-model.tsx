import React from "react";
import { twMerge } from "tailwind-merge";

import { Footer, FooterProps } from "./footer";
import { Header } from "./header";
import { MobileBarNavigation } from "./navigation/mobile-bar";

export const SoleModelLayout: React.FC<
	React.ComponentProps<"div"> & {
		footer?: FooterProps;
		mobileNavigation?: false;
		containerProps?: React.ComponentProps<"div">;
	}
> = ({ children, footer = {}, containerProps = {}, mobileNavigation, ...props }) => (
	<div
		{...props}
		className={twMerge(
			"flex min-h-screen grow flex-col items-center overflow-x-hidden bg-cream font-nunito text-black-80 dark:bg-black-80 dark:text-white-20 sm:flex-col",
			props.className
		)}
	>
		<Header />
		<div
			{...containerProps}
			className={twMerge(
				"flex w-full max-w-screen-lg grow flex-col items-center sm:justify-center sm:py-32 md:px-8",
				containerProps.className
			)}
		>
			{children}
		</div>
		<Footer {...footer} />
		{mobileNavigation !== false && <MobileBarNavigation />}
	</div>
);
