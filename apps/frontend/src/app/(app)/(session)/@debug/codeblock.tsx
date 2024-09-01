import { twMerge } from "tailwind-merge";

import type { FC, PropsWithChildren } from "react";

export const Codeblock: FC<PropsWithChildren<{ className?: string }>> = ({
	children,
	className
}) => {
	return (
		<div
			data-sentry-mask
			className={twMerge(
				"flex w-full flex-col gap-4 whitespace-pre-wrap break-all rounded-xl bg-white-30 px-4 py-3 font-mono shadow-brand-inset vision:bg-white-30/70 dark:bg-black-90/50 dark:text-white-20",
				className
			)}
		>
			{children}
		</div>
	);
};
