import { Slot } from "@radix-ui/react-slot";
import { twMerge } from "tailwind-merge";

export type InputLabelProps = {
	inline?: boolean;
	hint?: React.ReactNode;
} & React.ComponentProps<"label">;

export const InputLabelHint: React.FC<{ asChild?: boolean } & React.ComponentProps<"span">> = (
	{ className, asChild = false, ...props }
) => {
	const Component = asChild ? Slot : "span";

	return (
		<Component
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
				inline ? "flex-col" : "flex-wrap",
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
