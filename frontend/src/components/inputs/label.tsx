import React from "react";
import { twMerge } from "tailwind-merge";

export type LabelProps = React.ComponentProps<"label"> & {
	inline?: boolean;
	hint?: React.ReactNode;
};

export const LabelHint: React.FC<React.ComponentProps<"span">> = (props) => {
	return <span {...props} className={twMerge("text-gray-700", props.className)} />;
};
export const Label = Object.assign<React.FC<LabelProps>, { Hint: typeof LabelHint }>(
	(props) => {
		const { inline, children, hint, ...elementProps } = props;

		return (
			<label
				{...elementProps}
				className={twMerge(
					"flex font-nunito select-none gap-x-1 items-baseline",
					inline && "flex flex-col",
					props.className
				)}
			>
				<span className="text-xl">{children}</span>
				{typeof hint === "string" ? <LabelHint>{hint}</LabelHint> : hint}
			</label>
		);
	},
	{ Hint: LabelHint }
);
