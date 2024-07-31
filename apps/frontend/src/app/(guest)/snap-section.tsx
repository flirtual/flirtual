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
			"min-h-screen w-full snap-start snap-always pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] android:pt-[var(--safe-area-inset-top)]",
			props.className
		)}
	>
		{props.children}
	</section>
));
