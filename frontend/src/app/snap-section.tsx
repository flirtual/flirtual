import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export const SnapSection = forwardRef<HTMLElement, React.ComponentProps<"section">>(
	(props, ref) => (
		<section
			{...props}
			className={twMerge("min-h-screen w-full snap-start snap-always", props.className)}
			ref={ref}
		>
			{props.children}
		</section>
	)
);
