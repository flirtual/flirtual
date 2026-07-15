import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

// Scroll by one option's height every (interval)ms.
const scrollInterval = 50;

export function ScrollIndicator({ side, visible, target, itemSelector = "[data-key]", className }: {
	side: "down" | "up";
	visible: boolean;
	target?: HTMLElement | null;
	itemSelector?: string;
	className?: string;
}) {
	const Chevron = side === "up" ? ChevronUp : ChevronDown;
	const timer = useRef<number | null>(null);

	function stop() {
		if (timer.current === null) return;

		clearInterval(timer.current);
		timer.current = null;
	}

	function start() {
		if (!target || timer.current !== null) return;

		timer.current = window.setInterval(() => {
			const { scrollTop, scrollHeight, clientHeight } = target;
			const item = target.querySelector<HTMLElement>(itemSelector);
			const amount = item?.offsetHeight || clientHeight;

			if (side === "up") {
				if (scrollTop <= 0) return stop();
				target.scrollTop = scrollTop - amount;
			}
			else {
				if (scrollTop >= scrollHeight - clientHeight) return stop();
				target.scrollTop = scrollTop + amount;
			}
		}, scrollInterval);
	}

	useEffect(() => () => {
		if (timer.current !== null) clearInterval(timer.current);
	}, []);

	return (
		<div
			aria-hidden
			className={twMerge(
				"pointer-events-none absolute inset-x-0 z-20 flex h-7 cursor-default items-center justify-center py-1 transition-opacity",
				side === "up"
					? "top-0 bg-gradient-to-b from-black-90/5 to-transparent"
					: "bottom-0 bg-gradient-to-t from-black-90/5 to-transparent",
				// touch-none prevents a press-hold from being hijacked as a pan;
				// releasing fires pointerleave which stops the scroll.
				visible ? "pointer-events-auto touch-none opacity-100" : "opacity-0",
				className
			)}
			onPointerDown={(event) => {
				// Keep focus where it is, otherwise the press focuses the window
				// (blurring the input) and closes it.
				event.preventDefault();
				start();
			}}
			onPointerEnter={start}
			onPointerLeave={stop}
		>
			<Chevron className="size-4 text-black-90 dark:text-white-10" />
		</div>
	);
}
