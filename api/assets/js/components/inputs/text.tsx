import React from "react";
import { twMerge } from "tailwind-merge";

export const Text: React.FC<React.ComponentProps<"input">> = ({ type, ...props }) => (
	<input
		{...props}
		type={type || "text"}
		className={twMerge(
			"font-nunito bg-brand-grey shadow-brand-1 focus:ring-brand-coral focus:ring-offset-2 border-none rounded-xl focus:ring-2 text-xl px-4 py-2",
			props.className
		)}
	/>
);
