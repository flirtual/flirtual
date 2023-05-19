"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FC, ReactNode, useEffect, useRef, useState } from "react";
import { Portal } from "react-portal";
import { twMerge } from "tailwind-merge";

import { useGlobalEventListener } from "~/hooks/use-event-listener";
import { useScreenBreakpoint } from "~/hooks/use-screen-breakpoint";

export interface TooltipProps {
	value: ReactNode;
	className?: string;

	fragmentClassName?: string;
	children: ReactNode;
}

export const Tooltip: FC<TooltipProps> = ({
	value,
	fragmentClassName,
	children,
	...elementProps
}) => {
	const [visible, setVisible] = useState(false);

	const elementRef = useRef<HTMLDivElement>(null);
	const ref = useRef<HTMLDivElement>(null);

	const [elementRect, setElementRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
	const [rect, setRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

	useGlobalEventListener("document", "scroll", () => setVisible(false), visible);
	const isMobile = !useScreenBreakpoint("md");

	useEffect(() => {
		if (!elementRef.current || !ref.current) return;

		setElementRect(elementRef.current.getBoundingClientRect());
		setRect(ref.current.getBoundingClientRect());
	}, [visible]);

	return (
		<div
			className={twMerge("", fragmentClassName)}
			ref={elementRef}
			onMouseLeave={() => setVisible(false)}
			onMouseEnter={() => {
				if (isMobile) return;
				setVisible(true);
			}}
		>
			{children}
			<AnimatePresence>
				{visible && (
					<Portal>
						<motion.div
							animate={{ opacity: 1 }}
							initial={{ opacity: 0 }}
							ref={ref}
							transition={{ damping: 10, delay: 0.1 }}
							className={twMerge(
								"pointer-events-none fixed left-0 top-0 z-50 -mt-4 select-none rounded-lg bg-black-80 px-3 py-1 text-base text-white-20 shadow-brand-1 dark:bg-white-20 dark:text-black-80",
								elementProps.className
							)}
							style={{
								transform: `translate(${
									elementRect.x - rect.width / 2 + elementRect.width / 2
								}px, ${elementRect.y - rect.height}px)`
							}}
						>
							{value}
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>
		</div>
	);
};
