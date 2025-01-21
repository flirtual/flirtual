"use client";

import { Slot } from "@radix-ui/react-slot";
import { useLocale } from "next-intl";
import type { Url } from "next/dist/shared/lib/router/router";
// eslint-disable-next-line no-restricted-imports
import NextLink from "next/link";
import { forwardRef } from "react";

import { isInternalHref, toAbsoluteUrl } from "~/urls";

export type LinkProps = {
	href: Url | null;
	asChild?: boolean;
} & Omit<Parameters<typeof NextLink>[0], "href">;

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({
	href,
	lang,
	asChild = false,
	target,
	...props
}, reference) => {
	const currentLocale = useLocale();
	const locale = lang || currentLocale || "en";

	const url = toAbsoluteUrl(href?.toString() ?? "#");
	const internal = isInternalHref(url);

	if (internal) url.searchParams.set("language", locale);
	const Component = asChild ? Slot : href === null ? "span" : NextLink;

	return (
		<Component
			{...props}
			data-external={internal ? undefined : ""}
			href={url.href}
			lang={lang || locale}
			ref={reference}
			target={target || (internal ? "_self" : "_blank")}
		/>
	);
});
