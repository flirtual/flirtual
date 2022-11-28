import React from "react";
import { twMerge } from "tailwind-merge";

export type ModelCardProps = React.ComponentProps<"div"> & { title: React.ReactNode };

export const ModelCard: React.FC<ModelCardProps> = ({ children, title, ...props }) => (
	<div {...props} className={twMerge("w-full shrink-0 sm:w-full sm:max-w-lg", props.className)}>
		<div className="w-full bg-brand-gradient py-8 text-center font-extrabold text-white-10 shadow-brand-1 sm:w-fit sm:rounded-t-[4rem] sm:px-16 sm:pb-4 sm:text-right">
			<span className="font-montserrat text-3xl md:text-4xl">{title}</span>
		</div>
		<div className="bg-brand-gradient sm:rounded-3xl sm:rounded-tl-none sm:p-1 sm:shadow-brand-1">
			<div className="flex w-full flex-col bg-white-20 px-8 py-10 dark:bg-black-70 dark:text-white-20 sm:rounded-3xl sm:rounded-tl-none sm:px-16">
				{children}
			</div>
		</div>
	</div>
);
