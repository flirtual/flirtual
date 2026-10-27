import type { FC } from "react";
import { Trans } from "react-i18next";

import { useLocale } from "~/i18n";
import { urls } from "~/urls";

import { InlineLink } from "./inline-link";

export const MachineTranslatedLegal: FC<{
	intended?: string;
}> = ({ intended = "en" }) => {
	const [locale] = useLocale();

	if (intended === locale.split("-")[0]) return null;

	return (
		<div className="flex flex-col gap-2 rounded-lg bg-brand-gradient px-6 py-4 font-montserrat text-white-10">
			<span>
				<Trans
					components={{
						original: (
							<InlineLink
								className="underline"
								highlight={false}
								href="./"
								hrefLang="en"
							/>
						)
					}}
					i18nKey="policy_machine_translated"
				/>
				{" "}
			</span>
			<span>
				<Trans
					components={{
						contact: (
							<InlineLink
								className="underline"
								highlight={false}
								href={urls.resources.contact}
							/>
						)
					}}
					i18nKey="policy_contact"
				/>
			</span>
		</div>
	);
};
