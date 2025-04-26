"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";
import { twMerge } from "tailwind-merge";

export function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
	return (
		<SliderPrimitive.Root
			className={twMerge(
				"relative flex w-full touch-none items-center",
				className
			)}
			{...props}
		>
			<SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-white-40 shadow-brand-1 dark:bg-black-50">
				<SliderPrimitive.Range className="absolute h-full bg-brand-gradient data-[disabled]:bg-black-20 data-[disabled]:bg-none" />
			</SliderPrimitive.Track>
			{(props.value || props.defaultValue)?.map((_, index) => (
				<SliderPrimitive.Thumb
					className="block size-5 rounded-full border-2 border-none bg-brand-gradient shadow-brand-1 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-1 focus:ring-offset-2 focus:ring-offset-white-20 disabled:pointer-events-none disabled:bg-black-40 disabled:opacity-50 data-[disabled]:bg-black-20 data-[disabled]:bg-none vision:hover:cursor-pointer dark:ring-offset-black-50"
					// eslint-disable-next-line react/no-array-index-key
					key={index}
				/>
			))}
		</SliderPrimitive.Root>
	);
}
