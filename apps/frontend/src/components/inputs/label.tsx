import { twMerge } from "tailwind-merge";

export type InputLabelProps = {
	inline?: boolean;
	hint?: React.ReactNode;
} & React.ComponentProps<"label">;

export const InputLabelHint: React.FC<React.ComponentProps<"span">> = (
	{ className, ...props }
) => {
	return (
		<span
			{...props}
			className={twMerge(
				"text-base text-black-50 vision:text-white-50 dark:text-white-50",
				className
			)}
		/>
	);
};

export const InputLabel: React.FC<InputLabelProps> = (props) => {
	const { className, inline, children, hint, ...elementProps } = props;

	return (
		<label
			{...elementProps}
			className={twMerge(
				"flex items-baseline gap-x-2 font-nunito text-xl",
				inline && "flex-col",
				className
			)}
		>
			{children}
			{typeof hint === "string"
				? (
						<InputLabelHint>{hint}</InputLabelHint>
					)
				: (
						hint
					)}
		</label>
	);
};
