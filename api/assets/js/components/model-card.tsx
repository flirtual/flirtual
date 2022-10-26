import React from "react";
import { twMerge } from "tailwind-merge";

export type ModelCardProps = React.ComponentProps<"div"> & { title: React.ReactNode };

export const ModelCard: React.FC<ModelCardProps> = ({ children, title, ...props }) => (
	<div {...props} className={twMerge("w-full sm:w-fit", props.className)}>
		<div className="bg-brand-gradient shadow-brand-1 w-fit rounded-t-[4rem] px-16 pt-8 pb-4 text-white">
			<span className="font-montserrat text-4xl">{title}</span>
		</div>
		<div className="sm:shadow-brand-1 border-brand-coral flex w-full flex-col rounded-3xl rounded-tl-none border-4 bg-white px-8 py-10 sm:px-16">
			{children}
		</div>
	</div>
);
