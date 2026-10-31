import { Check } from "lucide-react";
import type React from "react";
import { twMerge } from "tailwind-merge";

export type InputCheckboxProps = { value?: boolean; onChange?: React.Dispatch<boolean> } & Omit<
	React.ComponentProps<"input">,
	"checked" | "onChange" | "type" | "value"
>;

export const InputCheckbox: React.FC<InputCheckboxProps> = (props) => {
	const { value, className, onChange, ...elementProps } = props;
	return (
		<div className="relative flex size-8 shrink-0 items-center justify-center">
			<input
				{...elementProps}
				className={twMerge(
					"peer size-full cursor-pointer items-center justify-center rounded-xl border-[3px] border-black-50 bg-white-30 text-2xl text-white-20 focusable transition-all checked:border-transparent checked:bg-brand-gradient checked:shadow-brand-1 dark:bg-black-60 dark:hocus:bg-black-60! vision:border-white-20/70 vision:bg-transparent checked:vision:border-none",
					className
				)}
				checked={value}
				type="checkbox"
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
