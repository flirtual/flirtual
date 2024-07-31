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
					"peer focusable size-full items-center justify-center rounded-xl border-[3px] border-black-50 bg-white-30 text-2xl text-white-20 transition-shadow checked:bg-brand-gradient checked:shadow-brand-1 vision:border-white-20/70 vision:bg-transparent vision:checked:border-none dark:bg-black-60",
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
