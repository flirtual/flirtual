import { SelectTrigger as RadixSelectTrigger } from "@radix-ui/react-select";
import { ChevronDown, Languages } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import { Link } from "~/components/link";
import { localeNames, locales, useLocale } from "~/i18n";

import {
	InputSelect,
	Select,
	SelectContent,
	SelectItem
} from "../select";

const InputLanguageSelect_: React.FC<{ className?: string; tabIndex?: number }> = ({ className, tabIndex }) => {
	const [locale, setLocale] = useLocale();

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
			onChange={setLocale}
		/>
	);
};

export const InputLanguageSelect = withSuspense(InputLanguageSelect_);

export const InlineLanguageSelect: React.FC<{ className?: string }> = ({ className }) => {
	const [locale, setLocale] = useLocale();

	return (
		<Select value={locale} onValueChange={setLocale}>
			<RadixSelectTrigger className={twMerge("focusable flex items-center gap-0.5em whitespace-nowrap rounded-lg", className)}>
				<Languages className="inline-block size-em" />
				{" "}
				<span className="grow">{localeNames[locale]}</span>
				{" "}
				<ChevronDown className="inline-block size-em" />
			</RadixSelectTrigger>
			<SelectContent>
				{locales.map((value) => (
					<SelectItem
						key={value}
						asChild
						className="flex w-full items-center gap-2"
						lang={value}
						value={value}
					>
						<Link href="./" hrefLang={value} lang={value}>
							{localeNames[value]}
						</Link>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
