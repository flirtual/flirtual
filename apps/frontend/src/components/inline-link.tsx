import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import { useLocale } from "next-intl";

import { isInternalHref, toAbsoluteUrl } from "~/urls";

import type { Url } from "next/dist/shared/lib/router/router";

export type InlineLinkProps = Omit<Parameters<typeof Link>[0], "href"> & {
	href: Url | null;
	highlight?: boolean;
	asChild?: boolean;
};

export const InlineLink: React.FC<InlineLinkProps> = ({
	href,
	lang,
	highlight = true,
	asChild = false,
	...props
}) => {
	const locale = useLocale();

	const url = toAbsoluteUrl(href?.toString() ?? "#");
	if (lang && locale !== lang) url.searchParams.set("language", lang);
	if (url.searchParams.get("language") === locale)
		url.searchParams.delete("language");

	const Component = asChild ? Slot : href === null ? "span" : Link;

	return (
		<Component
			{...props}
			href={url.href}
			lang={lang || locale}
			target={href && isInternalHref(href) ? "_self" : "_blank"}
			className={twMerge(
				"focus:outline-none hocus:underline",
				highlight && "text-theme-2",
				href && !isInternalHref(href) && "touch-callout-default",
				props.className
			)}
		/>
	);
};
