"use client";

import type { FC, PropsWithChildren } from "react";

import type { InlineLinkProps } from "~/components/inline-link";
import { useLocation } from "~/hooks/use-location";

import { BannerLink } from "../banner";

export const SelfLink: FC<
	PropsWithChildren<
		{ query?: Record<string, string | null> } & Omit<InlineLinkProps, "href">
	>
> = ({ children, query, ...props }) => {
	const location = useLocation();

	const url = new URL(location.href);
	if (query)
		Object.entries(query).forEach(([key, value]) => {
			if (value === null) return url.searchParams.delete(key);
			url.searchParams.set(key, value);
		});

	return (
		<BannerLink href={url.href} {...props}>
			{children}
		</BannerLink>
	);
};
