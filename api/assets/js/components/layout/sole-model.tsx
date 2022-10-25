import React from "react";
import { twMerge } from "tailwind-merge";

import { Footer } from "./footer";
import { Header } from "./header";

export const SoleModelLayout: React.FC<React.ComponentProps<"div">> = ({ children, ...props }) => (
	<div
		{...props}
		className={twMerge(
			"bg-brand-cream flex min-h-screen grow flex-col overflow-x-hidden text-black",
			props.className
		)}
	>
		<Header />
		<div className="flex items-center justify-center py-16 px-4 sm:py-32 md:px-32">{children}</div>
		<Footer />
	</div>
);
