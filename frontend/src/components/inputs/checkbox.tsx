import { CheckIcon } from "@heroicons/react/24/outline";
import { twMerge } from "tailwind-merge";
import React from "react";

export type CheckboxProps = Omit<React.ComponentProps<"input">, "type">;

export const Checkbox: React.FC<CheckboxProps> = (props) => (
	<div className="relative w-8 h-8 flex shrink-0 justify-center items-center">
		<input
			{...props}
			type="checkbox"
			className={twMerge(
				"peer focus:ring-brand-coral checked:bg-brand-gradient shadow-brand-1 border-brand-black w-full  h-full focus:ring-2 focus:ring-offset-2 rounded-xl text-white border-4 items-center justify-center text-2xl",
				props.className
			)}
		/>
		<CheckIcon
			className="text-brand-white w-6 h-6 absolute peer-checked:block hidden pointer-events-none"
			strokeWidth={3}
		/>
	</div>
);
