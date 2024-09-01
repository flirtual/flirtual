import { getTranslations } from "next-intl/server";

import { getInternationalization } from "~/i18n";

import { Banner } from "../banner";

import { SelfLink } from "./self-link";

export default async function () {
	const { locale } = await getInternationalization();
	const t = await getTranslations(`$${locale.preferred}.banners`);

	const languageNames = new Intl.DisplayNames(locale.preferred, {
		type: "language"
	});

	if (!locale.override) return null;

	return (
		<Banner>
			{t.rich("language", {
				current: languageNames.of(locale.current),
				preferred: languageNames.of(locale.preferred),
				link: (children) => (
					<SelfLink preferred={locale.preferred}>{children}</SelfLink>
				)
			})}
		</Banner>
	);
}
