import { CheckIcon } from "@heroicons/react/24/outline";
import React from "react";
import { twMerge } from "tailwind-merge";

export type CheckboxProps = Omit<React.ComponentProps<"input">, "type">;

export const Checkbox: React.FC<CheckboxProps> = (props) => (
	<div className="relative w-8 h-8 flex justify-center items-center">
		<input
			{...props}
			type="checkbox"
			className={twMerge(
				"w-full h-full focus:ring-brand-coral focus:ring-2 peer focus:ring-offset-2  rounded-xl checked:bg-brand-gradient text-white shadow-brand-1 border-4 border-brand-black items-center justify-center text-2xl",
				props.className
			)}
		/>
		<CheckIcon
			className="text-brand-white w-6 h-6 absolute peer-checked:block hidden pointer-events-none"
			strokeWidth={3}
		/>
	</div>
);
