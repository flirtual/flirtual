import { InputSelect } from "~/components/inputs";
import type { InputSelectOption } from "~/components/inputs";
import { setTranslationPreview, useTranslationPreview } from "~/i18n";
import type { TranslationPreview } from "~/i18n";
import { allLocales } from "~/i18n/languages";

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

const options: Array<InputSelectOption> = [
	{ id: "keys", name: "Raw keys" },
	...allLocales.map((locale) => ({ id: locale, name: `${languageNames.of(locale)} (${locale})` }))
];

export function TranslationPreviewSelect({ className }: { className?: string }) {
	const preview = useTranslationPreview();

	return (
		<InputSelect<TranslationPreview | null>
			optional
			className={className}
			options={options}
			placeholder="Off"
			value={preview}
			onChange={(value) => void setTranslationPreview(value)}
		/>
	);
}
