import { Check } from "lucide-react";
import { twMerge } from "tailwind-merge";

import type React from "react";

export type InputCheckboxProps = Omit<
	React.ComponentProps<"input">,
	"type" | "checked" | "value" | "onChange"
> & { value?: boolean; onChange?: React.Dispatch<boolean> };

export const InputCheckbox: React.FC<InputCheckboxProps> = (props) => {
	const { value, onChange, ...elementProps } = props;
	return (
		<div className="relative flex size-8 shrink-0 items-center justify-center">
			<input
				{...elementProps}
				checked={value}
				type="checkbox"
				className={twMerge(
					"hocus:dark:!bg-bg-white-30 peer focusable size-full cursor-pointer items-center justify-center rounded-xl border-none bg-white-30 text-2xl text-white-20 transition-all checked:bg-brand-gradient checked:shadow-brand-1 vision:bg-transparent vision:checked:border-none dark:bg-black-60 hocus:dark:!bg-black-60",
					props.className
				)}
				onChange={(event) => {
					if (!onChange) return;
					onChange(event.target.checked);
				}}
			/>
			<Check
				className="pointer-events-none absolute hidden size-6 text-white-20 peer-checked:block"
				strokeWidth={3}
			/>
		</div>
	);
};
