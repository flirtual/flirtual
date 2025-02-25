import Image from "next/image";
import type { PropsWithChildren } from "react";

import { urls } from "~/urls";

export function LoadingIndicator({ children }: PropsWithChildren) {
	return (
		<div className="flex min-h-screen w-full flex-col items-center justify-center opacity-75">
			<Image
				priority
				alt=""
				className="hidden w-1/2 max-w-sm animate-pulse vision:block dark:block"
				draggable={false}
				height={1000}
				src={urls.media("flirtual-white.svg", "files")}
				width={3468}
			/>
			<Image
				priority
				alt=""
				className="block w-1/2 max-w-sm animate-pulse vision:hidden dark:hidden"
				draggable={false}
				height={1000}
				src={urls.media("flirtual-black.svg", "files")}
				width={3468}
			/>
			{children}
		</div>
	);
}
