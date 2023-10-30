import { twMerge } from "tailwind-merge";
import { ComponentProps } from "react";

import { Footer, FooterProps } from "./footer";
import { Header } from "./header";
import { MobileBarNavigation } from "./navigation/mobile-bar";

export type SoleModelLayoutProps = ComponentProps<"div"> & {
	footer?: FooterProps;
	mobileNavigation?: false;
	containerProps?: React.ComponentProps<"div">;
};

export function SoleModelLayout({
	children,
	footer = {},
	containerProps = {},
	mobileNavigation,
	...props
}: SoleModelLayoutProps) {
	return (
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
					"flex w-full max-w-screen-lg grow flex-col items-center sm:justify-center sm:py-16 md:px-8",
					containerProps.className
				)}
			>
				{children}
			</div>
			<Footer className="sm:pb-36 lg:pb-20" {...footer} />
			{mobileNavigation !== false && <MobileBarNavigation />}
		</div>
	);
}
