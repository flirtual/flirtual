import { useLocale, useTranslations } from "next-intl";

import { urls } from "~/urls";

import { InlineLink } from "./inline-link";

import type { FC } from "react";

export const MachineTranslatedLegal: FC<{
	intended?: string;
	original: string;
}> = ({ intended = "en", original }) => {
	const t = useTranslations("machine-translated");
	const locale = useLocale();

	if (intended === locale.split("-")[0]) return null;

	return (
		<div className="flex flex-col gap-2 rounded-lg bg-brand-gradient px-6 py-4 font-montserrat text-white-10">
			<span>
				{t.rich("large_wild_tortoise_sing", {
					original: (children) => (
						<InlineLink
							className="underline"
							highlight={false}
							href={original}
							lang="en"
						>
							{children}
						</InlineLink>
					)
				})}{" "}
			</span>
			<span>
				{t.rich("active_frail_antelope_support", {
					contact: (children) => (
						<InlineLink
							className="underline"
							highlight={false}
							href={urls.resources.contact}
						>
							{children}
						</InlineLink>
					)
				})}
			</span>
		</div>
	);
};
