"use client";

import { twMerge } from "tailwind-merge";

export type InputLabelProps = React.ComponentProps<"label"> & {
	inline?: boolean;
	hint?: React.ReactNode;
};

export const InputLabelHint: React.FC<React.ComponentProps<"span">> = (props) => {
	return (
		<span
			{...props}
			className={twMerge("text-base text-black-50 dark:text-white-50", props.className)}
		/>
	);
};

export const InputLabel: React.FC<InputLabelProps> = (props) => {
	const { inline, children, hint, ...elementProps } = props;

	return (
		<label
			{...elementProps}
			className={twMerge(
				"flex select-none items-baseline gap-x-1 font-nunito text-xl",
				inline && "flex-col",
				props.className
			)}
		>
			{children}
			{typeof hint === "string" ? <InputLabelHint>{hint}</InputLabelHint> : hint}
		</label>
	);
};
