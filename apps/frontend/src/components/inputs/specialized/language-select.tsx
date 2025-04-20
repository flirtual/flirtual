"use client";

import { Languages } from "lucide-react";
import type { Locale } from "next-intl";
import { useLocale } from "next-intl";
import { type FC, useLayoutEffect } from "react";
import { withSuspense } from "with-suspense";

import { Link } from "~/components/link";
import { useOptionalSession } from "~/hooks/use-session";
import { useTheme } from "~/hooks/use-theme";
import { usePathname, useRouter } from "~/i18n/navigation";
import { localeNames, locales } from "~/i18n/routing";
import { useMutation } from "~/query";

import { InputSelect, SelectItem } from "../select";

const InputLanguageSelectItem: FC<{ value: Locale }> = ({ value, children, ...props }) => {
	const pathname = usePathname();

	return (
		<SelectItem {...props} asChild value={value}>
			<Link href={pathname} locale={value}>
				{children}
			</Link>
		</SelectItem>
	);
};

const InputLanguageSelect_: React.FC<{ className?: string; tabIndex?: number }> = ({ className, tabIndex }) => {
	const locale = useLocale();
	const [theme] = useTheme();

	// useLayoutEffect(() => {
	// 	document.documentElement.dataset.theme = theme;
	// }, [theme, locale]);

	const session = useOptionalSession();
	const pathname = usePathname();

	const router = useRouter();

	const { mutateAsync } = useMutation({
		mutationFn: async (locale: Locale) => {
			router.push(pathname, { locale });
		}
	});

	if (!session?.user.tags?.includes("debugger")) return null;

	return (
		<InputSelect
			options={locales.map((value) => ({
				id: value,
				name: localeNames[value]
			}))}
			className={className}
			Icon={Languages}
			// Item={InputLanguageSelectItem}
			tabIndex={tabIndex}
			value={locale}
			onChange={mutateAsync}
		/>
	);
};

export const InputLanguageSelect = withSuspense(InputLanguageSelect_);
