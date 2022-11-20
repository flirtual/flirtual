import React from "react";
import { twMerge } from "tailwind-merge";

export type ModelCardProps = React.ComponentProps<"div"> & { title: React.ReactNode };

export const ModelCard: React.FC<ModelCardProps> = ({ children, title, ...props }) => (
	<div {...props} className={twMerge("w-full sm:w-fit", props.className)}>
		<div className="w-full bg-brand-gradient py-8 text-center font-extrabold text-white shadow-brand-1 sm:w-fit sm:rounded-t-[4rem] sm:px-16 sm:pb-4 sm:text-right">
			<span className="font-montserrat text-3xl md:text-4xl">{title}</span>
		</div>
		<div className="flex w-full flex-col bg-white px-8 py-10 sm:rounded-3xl sm:rounded-tl-none sm:border-4 sm:border-brand-coral sm:px-16 sm:shadow-brand-1">
			{children}
		</div>
	</div>
);
