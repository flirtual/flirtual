import React from "react";
import { twMerge } from "tailwind-merge";

export type CheckboxProps = Omit<React.ComponentProps<"input">, "type">;

export const Checkbox: React.FC<CheckboxProps> = (props) => (
	<input
		{...props}
		type="checkbox"
		className={twMerge(
			"relative flex w-8 h-8 focus:ring-brand-coral rounded-xl checked:bg-brand-gradient text-white shadow-brand-1 border-4 border-brand-black items-center justify-center text-2xl checked:after:content-['']",
			props.className
		)}
	/>
);
