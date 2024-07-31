import { twMerge } from "tailwind-merge";

import { Footer, type FooterProps } from "./footer";
import { Header } from "./header";

import type { ComponentProps } from "react";

export type SoleModelLayoutProps = ComponentProps<"div"> & {
	footer?: FooterProps;
	navigation?: false;
	containerProps?: React.ComponentProps<"div">;
};

export function SoleModelLayout({
	children,
	footer = {},
	containerProps = {},
	navigation,
	...props
}: SoleModelLayoutProps) {
	return (
		<div
			vaul-drawer-wrapper=""
			{...props}
			className={twMerge(
				"flex min-h-screen grow flex-col items-center bg-white-20 font-nunito text-black-80 vision:bg-transparent dark:bg-black-70 dark:text-white-20 desktop:flex-col desktop:bg-cream desktop:dark:bg-black-80",
				props.className
			)}
		>
			{navigation !== false && <Header className="hidden desktop:flex" />}
			<div
				{...containerProps}
				className={twMerge(
					"max-w-screen-lg flex min-h-[calc(100svh-max(calc(env(safe-area-inset-bottom)+4.5rem),5rem))] w-full grow flex-col items-center desktop:p-8",
					containerProps.className
				)}
			>
				{children}
			</div>
			{navigation !== false && (
				<>
					<Footer className="desktop:pb-36 wide:pb-20" {...footer} />
					<Header className="desktop:hidden" />
				</>
			)}
		</div>
	);
}
