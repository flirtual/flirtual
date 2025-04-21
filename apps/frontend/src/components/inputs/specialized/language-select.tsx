"use client";

import { SelectTrigger as RadixSelectTrigger } from "@radix-ui/react-select";
import { ChevronDown, Languages } from "lucide-react";
import type { Locale } from "next-intl";
import { useLocale } from "next-intl";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import { usePathname, useRouter } from "~/i18n/navigation";
import { localeNames, locales } from "~/i18n/routing";
import { useMutation } from "~/query";

import {
	InputSelect,
	Select,
	SelectContent,
	SelectItem
} from "../select";

const InputLanguageSelect_: React.FC<{ className?: string; tabIndex?: number }> = ({ className, tabIndex }) => {
	const locale = useLocale();

	const pathname = usePathname();
	const router = useRouter();

	const { mutateAsync } = useMutation({
		mutationFn: async (locale: Locale) => {
			router.push(pathname, { locale });
		}
	});

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
			onChange={mutateAsync}
		/>
	);
};

export const InputLanguageSelect = withSuspense(InputLanguageSelect_);

export const InlineLanguageSelect: React.FC<{ className?: string }> = ({ className }) => {
	const locale = useLocale();

	const pathname = usePathname();
	const router = useRouter();

	return (
		<Select onValueChange={(locale: Locale) => router.push(pathname, { locale })}>
			<RadixSelectTrigger className={twMerge("focusable flex items-center gap-0.5em whitespace-nowrap", className)}>
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
