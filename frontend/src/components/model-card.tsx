import React from "react";
import { twMerge } from "tailwind-merge";

export type ModelCardProps = React.ComponentProps<"div"> & {
	title: React.ReactNode;
	titleProps?: React.ComponentProps<"div">;
	containerProps?: React.ComponentProps<"div">;
};

export const ModelCard: React.FC<ModelCardProps> = ({
	children,
	title,
	titleProps = {},
	containerProps = {},
	...props
}) => (
	<div {...props} className={twMerge("w-full shrink-0 sm:w-full sm:max-w-lg", props.className)}>
		<div
			{...titleProps}
			className={twMerge(
				"w-full bg-brand-gradient py-7 text-center font-montserrat text-3xl font-extrabold text-white-10 shadow-brand-1 sm:w-fit sm:max-w-[calc(100%-1.5rem)] sm:rounded-t-[4rem] sm:px-16 sm:pb-6 sm:text-left md:text-4xl",
				titleProps.className
			)}
		>
			{title}
		</div>
		<div className="bg-brand-gradient sm:rounded-3xl sm:rounded-tl-none sm:p-1 sm:shadow-brand-1">
			<div
				{...containerProps}
				className={twMerge(
					"flex w-full flex-col bg-white-20 px-8 py-10 dark:bg-black-70 dark:text-white-20 sm:rounded-3xl sm:rounded-tl-none sm:px-16",
					containerProps.className
				)}
			>
				{children}
			</div>
		</div>
	</div>
);
