"use client";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";

import { Link as NextIntlLink } from "~/i18n/navigation";
import { isInternalHref, toAbsoluteUrl } from "~/urls";

export type LinkProps = {
	asChild?: boolean;
} & Parameters<typeof NextIntlLink>[0];

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({
	href,
	asChild = false,
	target,
	...props
}, reference) => {
	const url = toAbsoluteUrl(href?.toString() ?? "#");
	const internal = isInternalHref(url);

	const Component = asChild
		? Slot
		: href === null
			? "span"
			: NextIntlLink;

	return (
		<Component
			{...props}
			data-external={internal ? undefined : ""}
			href={href}
			ref={reference}
			target={target || (internal ? undefined : "_blank")}
		/>
	);
});
