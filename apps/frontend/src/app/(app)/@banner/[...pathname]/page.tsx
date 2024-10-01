import { getTranslations } from "next-intl/server";
import { match, P } from "ts-pattern";

import { getInternationalization } from "~/i18n";

import { Banner } from "../banner";

import { SelfLink } from "./self-link";

export default async function FallbackBanner() {
	const { locale, translating } = await getInternationalization();

	const t = await getTranslations("banners");
	const tPreferred = await getTranslations("_preferred.banners");

	const languageNames = new Intl.DisplayNames(locale.preferred, {
		type: "language"
	});

	return (
		<>
			{match({ translating, locale })
				.with({ translating: true }, () => (
					<Banner>
						{t.rich("translating", {
							link: (children) => (
								<SelfLink query={{ translating: null }}>{children}</SelfLink>
							)
						})}
					</Banner>
				))
				.with({ locale: { current: P.not(locale.preferred) } }, () => (
					<Banner>
						{tPreferred.rich("language", {
							current: languageNames.of(locale.current),
							preferred: languageNames.of(locale.preferred),
							link: (children) => (
								<SelfLink lang={locale.preferred}>{children}</SelfLink>
							)
						})}
					</Banner>
				))
				.otherwise(() => null)}
		</>
	);
}
