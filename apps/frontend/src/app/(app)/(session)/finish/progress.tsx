"use client";

import { twMerge } from "tailwind-merge";

import { InlineLink } from "~/components/inline-link";
import { type FinishPage, urls } from "~/urls";

const ProgressLink: React.FC<{
	page: FinishPage;
	name: string;
	current: FinishPage;
}> = ({ page, name, current }) => {
	const active = current >= page;

	return (
		<InlineLink
			href={urls.finish(page)}
			className={twMerge(
				"z-10 hidden h-fit justify-center px-3 hocus:no-underline desktop:flex",
				active ? "text-white-10" : "text-black-70 dark:text-white-10"
			)}
		>
			{name}
		</InlineLink>
	);
};

export const FinishProgress: React.FC<{ page: FinishPage }> = ({ page }) => {
	return (
		<div className="fixed inset-x-0 bottom-[max(calc(env(safe-area-inset-bottom,0rem)+4.5rem),5.25rem)] isolate z-10 flex h-7 w-full px-4 vision:bottom-3 vision:mx-4 vision:w-[calc(100%-2rem)] desktop:relative desktop:inset-0 desktop:mb-8 desktop:h-9 desktop:max-w-2xl">
			<div className="absolute inset-0 -right-4 left-4 desktop:max-w-2xl">
				<div
					className={twMerge(
						"flex h-6 items-center justify-center rounded-full bg-brand-gradient px-4 desktop:h-9",
						page !== 5 && "rounded-r-none"
					)}
					style={{
						width: `calc(${page * 20}% - ${page * 0.4}rem)`
					}}
				>
					<span className="text-white-10 desktop:hidden">{page}/5</span>
				</div>
			</div>
			<div className="grid h-6 w-full grid-cols-3 items-center justify-center rounded-full bg-white-30 shadow-brand-1 vision:bg-white-30/70 dark:bg-black-60 desktop:h-9 desktop:max-w-2xl desktop:grid-cols-5">
				<ProgressLink current={page} name="Bio & pics" page={1} />
				<ProgressLink current={page} name="Details" page={2} />
				<ProgressLink current={page} name="Interests" page={3} />
				<ProgressLink current={page} name="Personality" page={4} />
				<ProgressLink current={page} name="Connections" page={5} />
			</div>
		</div>
	);
};
