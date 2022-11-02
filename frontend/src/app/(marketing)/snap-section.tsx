import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export const SnapSection = forwardRef<HTMLElement, React.ComponentProps<"section">>(
	(props, ref) => (
		<section
			{...props}
			className={twMerge("w-full min-h-screen snap-always snap-start", props.className)}
			ref={ref}
		>
			{props.children}
		</section>
	)
);
