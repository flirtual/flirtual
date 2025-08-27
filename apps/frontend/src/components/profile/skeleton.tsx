import { twMerge } from "tailwind-merge";

export function ProfileSkeleton({ className }: { className?: string }) {
	return (
		<div
			className={twMerge(
				"flex w-full vision:bg-none desktop:max-w-lg desktop:rounded-3xl desktop:bg-brand-gradient desktop:p-1 desktop:shadow-brand-1",
				className
			)}
		>
			<div className="flex w-full flex-col overflow-hidden bg-transparent text-black-70 dark:text-white-20 desktop:rounded-[1.25rem] desktop:bg-white-20 desktop:shadow-brand-inset dark:desktop:bg-black-70">
				{/* Profile picture */}
				<div className="relative shrink-0 overflow-hidden">
					<div className="relative flex aspect-square shrink-0 bg-black-70">
						<div className="size-full bg-white-10/20 bg-brand-gradient" />
						<div className="absolute bottom-0 h-1/3 w-full bg-gradient-to-b from-transparent via-black-90/20 to-black-90/60">
							<div className="absolute bottom-0 flex w-full flex-col gap-2 p-8">
								{/* Name/age */}
								<div className="flex items-baseline gap-4">
									<div className="h-9 w-48 animate-pulse rounded bg-white-10/30" />
									<div className="h-8 w-12 animate-pulse rounded bg-white-10/30" />
								</div>
								{/* Gender/country */}
								<div className="flex flex-wrap items-center gap-2">
									<div className="h-8 w-20 animate-pulse rounded-xl bg-white-10/30" />
									<div className="h-8 w-24 animate-pulse rounded-xl bg-white-10/30" />
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="h-1 shrink-0 bg-brand-gradient desktop:hidden" />
				<div className="flex h-full grow flex-col gap-6 break-words p-8">
					{/* Bio */}
					<div className="flex flex-col gap-2">
						<div className="h-4 w-full animate-pulse rounded bg-black-90/10 dark:bg-white-10/20" />
						<div className="h-4 w-5/6 animate-pulse rounded bg-black-90/10 dark:bg-white-10/20" />
						<div className="h-4 w-11/12 animate-pulse rounded bg-black-90/10 dark:bg-white-10/20" />
						<div className="h-4 w-4/6 animate-pulse rounded bg-black-90/10 dark:bg-white-10/20" />
						<div className="h-4 w-1/3 animate-pulse rounded bg-black-90/10 dark:bg-white-10/20" />
					</div>

					{/* Prompt */}
					<div className="flex flex-col gap-4">
						<div className="rounded-xl bg-black-90/5 p-4 dark:bg-white-10/10">
							<div className="mb-2 h-4 w-2/3 animate-pulse rounded bg-black-90/10 dark:bg-white-10/20" />
							<div className="h-4 w-full animate-pulse rounded bg-black-90/10 dark:bg-white-10/20" />
						</div>
					</div>

					{/* Tags */}
					<div className="flex flex-wrap gap-2">
						<div className="h-8 w-24 animate-pulse rounded-xl bg-black-90/10 dark:bg-white-10/20" />
						<div className="h-8 w-32 animate-pulse rounded-xl bg-black-90/10 dark:bg-white-10/20" />
						<div className="h-8 w-20 animate-pulse rounded-xl bg-black-90/10 dark:bg-white-10/20" />
						<div className="h-8 w-28 animate-pulse rounded-xl bg-black-90/10 dark:bg-white-10/20" />
						<div className="h-8 w-36 animate-pulse rounded-xl bg-black-90/10 dark:bg-white-10/20" />
					</div>
				</div>
			</div>
		</div>
	);
}
