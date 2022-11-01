import React from "react";
import { twMerge } from "tailwind-merge";

export type ModelCardProps = React.ComponentProps<"div"> & { title: React.ReactNode };

export const ModelCard: React.FC<ModelCardProps> = ({ children, title, ...props }) => (
	<div {...props} className={twMerge("w-full sm:w-fit", props.className)}>
		<div className="bg-brand-gradient font-extrabold w-full sm:w-fit text-center sm:text-right shadow-brand-1 rounded-t-[4rem] sm:px-16 pt-8 pb-4 text-white">
			<span className="font-montserrat text-3xl md:text-4xl">{title}</span>
		</div>
		<div className="sm:shadow-brand-1 border-brand-coral flex w-full flex-col rounded-3xl rounded-t-none sm:rounded-tr-3xl border-4 bg-white px-8 py-10 sm:px-16">
			{children}
		</div>
	</div>
);
