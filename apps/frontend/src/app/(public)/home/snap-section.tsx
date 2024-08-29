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
			"h-screen min-h-screen w-screen min-w-[100vw] snap-start snap-always pb-[env(safe-area-inset-bottom,0rem)] pl-[env(safe-area-inset-left,0rem)] pr-[env(safe-area-inset-right,0rem)] pt-[env(safe-area-inset-top,0rem)] android:pt-[var(--safe-area-inset-top,0rem)]",
			props.className
		)}
	>
		{props.children}
	</section>
));
