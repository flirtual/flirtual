import { Slot } from "@radix-ui/react-slot";
import type { Ref } from "react";
import type { PathPattern } from "react-router";
import { Link as _Link, matchPath, resolvePath, useLocation } from "react-router";

import { replaceLanguage, useLocale } from "~/i18n";
import type { Locale } from "~/i18n";
// import { Link as NextIntlLink, usePathname } from "~/i18n/navigation";
import { isInternalHref } from "~/urls";

export type LinkProps = {
	active?: boolean;
	asChild?: boolean;
	as?: string;
} & {
	href: Parameters<typeof _Link>[0]["to"] | null;
	pattern?: PathPattern<string>;
	hrefLang?: Locale;
} & Omit<Parameters<typeof _Link>[0], "hrefLang" | "to">;

export function Link({
	ref: reference,
	href: _href,
	pattern: _pattern,
	active: _active,
	asChild = false,
	hrefLang: _hrefLang,
	as = "span",
	target,
	...props
}: { ref?: Ref<HTMLAnchorElement> | null } & LinkProps) {
	const location = useLocation();

	const [locale] = useLocale();
	const hrefLang = _hrefLang || locale;

	const internal = _href ? isInternalHref(_href) : true;

	const to = internal && _href
		? replaceLanguage(_href, hrefLang, location.pathname)
		: _href || "#";

	const pattern = _pattern || (internal && to ? { path: resolvePath(to, location.pathname).pathname } : undefined);
	const active = _active || (pattern && matchPath(pattern, location.pathname) !== null);

	const Component = asChild
		? Slot
		: _href === null
			? as
			: _Link;

	return (
		<Component
			data-active={active ? "" : undefined}
			data-external={internal ? undefined : ""}
			hrefLang={hrefLang}
			{...props}
			ref={reference}
			target={target || (internal ? undefined : "_blank")}
			to={to}
		/>
	);
}
