import { AnimatePresence } from "motion/react";
import ms from "ms.macro";
import { useState } from "react";
import type { PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";
import FlirtualBlack from "virtual:remote/static/flirtual-black.svg";
import FlirtualWhite from "virtual:remote/static/flirtual-white.svg";

import { Image } from "~/components/image";
import { useTimeout } from "~/hooks/use-interval";

import { LongerThanUsual } from "./longer-than-usual";

export function Loading({ className, children }: PropsWithChildren<{ className?: string }>) {
	const [longerThanUsual, setLongerThanUsual] = useState(false);
	useTimeout(() => setLongerThanUsual(true), ms("5s"));

	return (
		<div className={twMerge("flex min-h-screen w-full flex-col items-center justify-center opacity-75", className)}>
			<div className="w-2/3 max-w-sm animate-pulse desktop:w-1/2">
				<Image
					priority
					alt=""
					className="hidden w-full vision:block dark:block"
					draggable={false}
					height={1000}
					src={FlirtualWhite}
					width={3468}
				/>
				<Image
					priority
					alt=""
					className="block w-full vision:hidden dark:hidden"
					draggable={false}
					height={1000}
					src={FlirtualBlack}
					width={3468}
				/>
			</div>
			<AnimatePresence>
				{longerThanUsual && (<LongerThanUsual />)}
			</AnimatePresence>
			{children}
		</div>
	);
}
