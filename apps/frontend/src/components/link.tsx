import { Slot } from "@radix-ui/react-slot";
import type { Ref } from "react";
import { Link as _Link } from "react-router";

import { useLocale } from "~/i18n";
import type { Locale } from "~/i18n";
// import { Link as NextIntlLink, usePathname } from "~/i18n/navigation";
import { isInternalHref } from "~/urls";

export type LinkProps = {
	active?: boolean;
	asChild?: boolean;
	as?: string;
} & {
	href: Parameters<typeof _Link>[0]["to"] | null;
	lang?: Locale;
} & Omit<Parameters<typeof _Link>[0], "lang" | "to">;

export function Link({
	ref: reference,
	href,
	active: _active,
	asChild = false,
	lang: _lang,
	as = "span",
	target,
	...props
}: { ref?: Ref<HTMLAnchorElement> | null } & LinkProps) {
	// const location = useLocation();

	const [locale] = useLocale();
	const lang = _lang || locale;

	const internal = isInternalHref(href || "#");
	// const active = (_active === undefined && location && href)
	// 	? urlEqual(toAbsoluteUrl(href.toString()), location, false)
	// 	: _active || false;
	const active = false;

	const Component = asChild
		? Slot
		: href === null
			? as
			: _Link;

	return (
		<Component
			data-active={active ? "" : undefined}
			data-external={internal ? undefined : ""}
			lang=""
			{...props}
			ref={reference}
			target={target || (internal ? undefined : "_blank")}
			to={href || "#"}
		/>
	);
}
