import type { FC, PropsWithChildren, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export interface SplitPanesProps {
	aside: ReactNode;
	className?: string;
	asideClassName?: string;
	mainClassName?: string;
}

// A list beside the page on wide screens, scrolling on its own, and stacked above it otherwise.
// Each pane reaches the screen edge on its own side, and they meet in the middle of the fold when
// there is one. --split-top and --split-bottom are whatever navigation and padding sits above and
// below the list.
export const SplitPanes: FC<PropsWithChildren<SplitPanesProps>> = ({ aside, className, asideClassName, mainClassName, children }) => (
	<div data-split-panes className={twMerge("flex w-full grow flex-col [--split-bottom:calc(4rem+max(calc(var(--safe-area-inset-bottom,0rem)-0.25rem),0.5rem))] [--split-top:var(--safe-area-inset-top,0rem)] native-nav:[--split-bottom:0px] split:flex-row split:items-start desktop:flex-row desktop:justify-center desktop:gap-4 native-nav:desktop:[--split-bottom:calc(2rem+var(--safe-area-inset-bottom,0rem))] native-nav:desktop:[--split-top:calc(2rem+var(--safe-area-inset-top,0rem))]", className)}>
		<div className={twMerge("contents split:sticky split:top-[var(--split-top)] split:block split:h-[calc(100dvh-var(--split-top)-var(--split-bottom))] split:w-[var(--split-list-width,22rem)] split:shrink-0 split:[--content-inset-right:0px] split:[--top-clearance-right:0px]", asideClassName)}>
			{aside}
		</div>
		<div className={twMerge("flex w-full flex-col items-center split:min-w-0 split:grow split:[--content-inset-left:0px] split:[--top-clearance-left:0px] native-nav:split:pb-[var(--safe-area-inset-bottom,0rem)] desktop:pb-0 web-nav:desktop:contents", mainClassName)}>
			{children}
		</div>
	</div>
);
