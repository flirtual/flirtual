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
	<div
		{...props}
		className={twMerge(
			"w-full shrink-0 rounded-2xl desktop:w-full desktop:max-w-lg desktop:shadow-brand-1",
			props.className
		)}
	>
		<div
			{...titleProps}
			className={twMerge(
				"w-full select-none bg-brand-gradient py-7 pt-[max(calc(env(safe-area-inset-top,0rem)+1rem),1.75rem)] text-center font-montserrat text-3xl font-extrabold text-white-20 android:pt-[max(calc(var(--safe-area-inset-top,0rem)+1rem),1.75rem)] desktop:w-full desktop:rounded-t-2xl desktop:px-8 desktop:pb-4 desktop:pt-[1.125rem] desktop:text-2xl android:desktop:pt-[1.125rem]",
				titleProps.className
			)}
		>
			{title}
		</div>
		<div className="h-full vision:bg-none desktop:rounded-2xl desktop:rounded-t-none desktop:bg-brand-gradient desktop:p-1 desktop:pt-0">
			<div
				{...containerProps}
				className={twMerge(
					"flex size-full flex-col px-8 py-10 pb-[max(env(safe-area-inset-bottom,0rem),2.5rem)] vision:bg-transparent vision:text-white-20 dark:bg-transparent dark:text-white-20 desktop:rounded-xl desktop:bg-white-20 desktop:px-16 desktop:shadow-brand-inset dark:desktop:bg-black-70",
					containerProps.className
				)}
			>
				{children}
			</div>
		</div>
	</div>
);
