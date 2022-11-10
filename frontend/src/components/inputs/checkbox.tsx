import { CheckIcon } from "@heroicons/react/24/outline";
import React from "react";
import { twMerge } from "tailwind-merge";

export type InputCheckboxProps = Omit<
	React.ComponentProps<"input">,
	"type" | "checked" | "value" | "onChange"
> & { value?: boolean; onChange?: React.Dispatch<boolean> };

export const InputCheckbox: React.FC<InputCheckboxProps> = (props) => {
	const { value, onChange, ...elementProps } = props;
	return (
		<div className="relative w-8 h-8 flex shrink-0 justify-center items-center">
			<input
				{...elementProps}
				checked={value}
				type="checkbox"
				className={twMerge(
					"peer focus:ring-brand-coral checked:bg-brand-gradient shadow-brand-1 border-brand-black w-full  h-full focus:ring-2 focus:ring-offset-2 rounded-xl text-white border-4 items-center justify-center text-2xl",
					props.className
				)}
				onChange={(event) => {
					if (!onChange) return;
					onChange(event.target.checked);
				}}
			/>
			<CheckIcon
				className="text-brand-white w-6 h-6 absolute peer-checked:block hidden pointer-events-none"
				strokeWidth={3}
			/>
		</div>
	);
};
