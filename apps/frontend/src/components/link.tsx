"use client";

import { Slot } from "@radix-ui/react-slot";
import type { Ref } from "react";

import { Link as NextIntlLink } from "~/i18n/navigation";
import { isInternalHref } from "~/urls";

export type LinkProps = {
	asChild?: boolean;
} & {
	href: Parameters<typeof NextIntlLink>[0]["href"] | null;
} & Omit<Parameters<typeof NextIntlLink>[0], "href">;

export function Link({
	ref: reference,
	href,
	asChild = false,
	target,
	...props
}: { ref?: Ref<HTMLAnchorElement> | null } & LinkProps) {
	const internal = isInternalHref(href || "#");

	const Component = asChild
		? Slot
		: href === null
			? "span"
			: NextIntlLink;

	return (
		<Component
			{...props}
			data-external={internal ? undefined : ""}
			href={href || "#"}
			ref={reference}
			target={target || (internal ? undefined : "_blank")}
		/>
	);
}
