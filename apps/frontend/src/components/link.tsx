"use client";

import { Slot } from "@radix-ui/react-slot";
import type { Ref } from "react";

import { siteOrigin } from "~/const";
import { Link as NextIntlLink, usePathname } from "~/i18n/navigation";
import { isInternalHref, toAbsoluteUrl, urlEqual } from "~/urls";

export type LinkProps = {
	active?: boolean;
	asChild?: boolean;
	as?: string;
} & {
	href: Parameters<typeof NextIntlLink>[0]["href"] | null;
} & Omit<Parameters<typeof NextIntlLink>[0], "href">;

export function Link({
	ref: reference,
	href,
	active: _active,
	asChild = false,
	as = "span",
	target,
	...props
}: { ref?: Ref<HTMLAnchorElement> | null } & LinkProps) {
	// Doesn't respect search parameters, as both the `useLocation` and `useSearchParams` hooks
	// require a suspense boundary. Consider manually passing `active` as an argument if needed.
	const location = new URL(usePathname(), siteOrigin);

	const internal = isInternalHref(href || "#");
	const active = (_active === undefined && location && href)
		? urlEqual(toAbsoluteUrl(href.toString()), location, false)
		: _active || false;

	const Component = asChild
		? Slot
		: href === null
			? as
			: NextIntlLink;

	return (
		<Component
			data-active={active ? "" : undefined}
			data-external={internal ? undefined : ""}
			{...props}
			href={href || "#"}
			ref={reference}
			target={target || (internal ? undefined : "_blank")}
		/>
	);
}
