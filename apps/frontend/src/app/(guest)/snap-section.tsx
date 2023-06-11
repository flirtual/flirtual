import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export const SnapSection = forwardRef<
	HTMLElement,
	React.ComponentProps<"section">
>((props, reference) => (
	<section
		{...props}
		ref={reference}
		className={twMerge(
			"min-h-screen w-full snap-start snap-always",
			props.className
		)}
	>
		{props.children}
	</section>
));
