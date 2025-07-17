import { SelectTrigger as RadixSelectTrigger } from "@radix-ui/react-select";
import { ChevronDown, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import type { Locale } from "~/i18n";
import { localeNames, locales, useLocale } from "~/i18n";

import {
	InputSelect,
	Select,
	SelectContent,
	SelectItem
} from "../select";

const InputLanguageSelect_: React.FC<{ className?: string; tabIndex?: number }> = ({ className, tabIndex }) => {
	const { i18n } = useTranslation();
	const locale = useLocale();

	return (
		<InputSelect
			options={locales.map((value) => ({
				id: value,
				name: localeNames[value]
			}))}
			className={className}
			Icon={Languages}
			tabIndex={tabIndex}
			value={locale}
			onChange={(locale) => i18n.changeLanguage(locale)}
		/>
	);
};

export const InputLanguageSelect = withSuspense(InputLanguageSelect_);

export const InlineLanguageSelect: React.FC<{ className?: string }> = ({ className }) => {
	const { i18n } = useTranslation();
	const locale = useLocale();

	return (
		<Select onValueChange={(locale: Locale) => i18n.changeLanguage(locale)}>
			<RadixSelectTrigger className={twMerge("focusable rounded-lg flex items-center gap-0.5em whitespace-nowrap", className)}>
				<Languages className="inline-block size-em" />
				{" "}
				{localeNames[locale]}
				{" "}
				<ChevronDown className="inline-block size-em" />
			</RadixSelectTrigger>
			<SelectContent>
				{locales.map((value) => (
					<SelectItem
						className="flex w-full items-center gap-2"
						key={value}
						value={value}
					>
						{localeNames[value]}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
