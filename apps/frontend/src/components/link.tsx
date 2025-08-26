import { Slot } from "@radix-ui/react-slot";
import { useMemo } from "react";
import type { Ref } from "react";
import type { PathPattern } from "react-router";
import {
	Link as _Link,
	createPath,
	matchPath,
	matchRoutes,
	resolvePath,
	useLocation
} from "react-router";

import { client } from "~/const";
import { replaceLanguage, useLocale } from "~/i18n";
import type { Locale } from "~/i18n";
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

	const { to, internal, active, matches } = useMemo(() => {
		const internal = _href ? isInternalHref(_href) : true;

		const to = internal && _href
			? createPath(replaceLanguage(_href, hrefLang, location.pathname))
			: _href || "#";

		const pattern = _pattern || (internal && to ? { path: resolvePath(to, location.pathname).pathname } : undefined);
		const active = _active || (pattern && matchPath(pattern, location.pathname) !== null) || false;

		const matches = client
			// @ts-expect-error: React Router internal.
			? matchRoutes(globalThis.__reactRouterDataRouter.routes, to) || []
			: [];

		return { to, internal, matches, active };
	}, [_active, _href, _pattern, hrefLang, location.pathname]);

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
			prefetch="intent"
			onPointerEnter={() => {
				Promise.all(matches.map(async ({ route }) => {
					// @ts-expect-error: React Router internal.
					const handle = route.handle || await route.lazy?.handle();
					if (!handle || typeof handle !== "object" || !handle.preload) return null;

					return handle.preload();
				}));
			}}
			{...props}
			ref={reference}
			target={target || (internal ? undefined : "_blank")}
			to={to}
		/>
	);
}
