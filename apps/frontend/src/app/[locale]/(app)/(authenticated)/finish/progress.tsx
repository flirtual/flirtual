import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { InlineLink } from "~/components/inline-link";
import { useOptionalSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import type { FinishPage } from "~/urls";

const ProgressLink: React.FC<{
	page: FinishPage;
	name: string;
	current: FinishPage;
	disabled?: boolean;
}> = ({ page, name, current, disabled = false }) => {
	const active = current >= page;

	return (
		<InlineLink
			className={twMerge(
				"z-10 hidden h-fit justify-center px-3 hocus:no-underline desktop:flex",
				active ? "text-white-10" : "text-black-70 dark:text-white-10",
				disabled && "opacity-50"
			)}
			href={disabled ? null : urls.finish(page)}
		>
			{name}
		</InlineLink>
	);
};

export const FinishProgress: React.FC<{ page: FinishPage }> = ({ page }) => {
	const { t } = useTranslation();
	const session = useOptionalSession();

	const profile = session?.user.profile;
	const locked
		= !profile?.displayName
			|| !profile.biography
			|| profile.images.length === 0;

	return (
		<div className="fixed inset-x-0 bottom-[max(calc(var(--safe-area-inset-bottom,0rem)+4.5rem),5.25rem)] isolate z-10 flex h-7 w-full px-4 vision:bottom-3 vision:mx-4 vision:w-[calc(100%-2rem)] desktop:relative desktop:inset-0 desktop:mb-8 desktop:h-9 desktop:max-w-2xl">
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
					<span className="text-white-10 desktop:hidden">
						{page}
						/5
					</span>
				</div>
			</div>
			<div className="grid h-6 w-full grid-cols-3 items-center justify-center rounded-full bg-white-30 shadow-brand-1 vision:bg-white-30/70 dark:bg-black-60 desktop:h-9 desktop:max-w-2xl desktop:grid-cols-5">
				<ProgressLink name={t("bio_pics")} current={page} page={1} />
				<ProgressLink name={t("details")} current={page} disabled={locked} page={2} />
				<ProgressLink name={t("interests")} current={page} disabled={locked} page={3} />
				<ProgressLink name={t("personality")} current={page} disabled={locked} page={4} />
				<ProgressLink name={t("connections")} current={page} disabled={locked} page={5} />
			</div>
		</div>
	);
};
