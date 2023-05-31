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
					"peer focusable h-full w-full items-center justify-center rounded-xl border-4 border-black-50 bg-white-30 text-2xl text-white-20 shadow-brand-1 checked:bg-brand-gradient dark:bg-black-60",
					props.className
				)}
				onChange={(event) => {
					if (!onChange) return;
					onChange(event.target.checked);
				}}
			/>
			<CheckIcon
				className="pointer-events-none absolute hidden h-6 w-6 text-white-20 peer-checked:block"
				strokeWidth={3}
			/>
		</div>
	);
};
