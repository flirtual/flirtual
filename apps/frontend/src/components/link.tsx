"use client";

import { Slot } from "@radix-ui/react-slot";
import type { Ref } from "react";
import { useState } from "react";

import { useHydratedCallback } from "~/hooks/use-hydrated";
import { Link as NextIntlLink } from "~/i18n/navigation";
import { isInternalHref, toAbsoluteUrl, urlEqual } from "~/urls";

export type LinkProps = {
	asChild?: boolean;
	as?: string;
} & {
	href: Parameters<typeof NextIntlLink>[0]["href"] | null;
} & Omit<Parameters<typeof NextIntlLink>[0], "href">;

export function Link({
	ref: reference,
	href,
	asChild = false,
	as = "span",
	target,
	...props
}: { ref?: Ref<HTMLAnchorElement> | null } & LinkProps) {
	// todo: I don't think this works.
	const [location, setLocation] = useState<URL>();
	useHydratedCallback(() => setLocation(new URL(window.location.href)));

	const internal = isInternalHref(href || "#");
	const active = (location && href)
		? urlEqual(toAbsoluteUrl(href.toString()), location)
		: false;

	const Component = asChild
		? Slot
		: href === null
			? as
			: NextIntlLink;

	return (
		<Component
			{...props}
			data-active={active ? "" : undefined}
			data-external={internal ? undefined : ""}
			href={href || "#"}
			ref={reference}
			target={target || (internal ? undefined : "_blank")}
		/>
	);
}
