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
		<div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
			<input
				{...elementProps}
				checked={value}
				type="checkbox"
				className={twMerge(
					"peer h-full w-full items-center justify-center rounded-xl  border-4 border-brand-black text-2xl text-white shadow-brand-1 checked:bg-brand-gradient focus:ring-2 focus:ring-brand-coral focus:ring-offset-2",
					props.className
				)}
				onChange={(event) => {
					if (!onChange) return;
					onChange(event.target.checked);
				}}
			/>
			<CheckIcon
				className="pointer-events-none absolute hidden h-6 w-6 text-brand-white peer-checked:block"
				strokeWidth={3}
			/>
		</div>
	);
};
