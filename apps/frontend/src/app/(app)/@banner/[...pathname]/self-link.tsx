"use client";

import { useLocation } from "~/hooks/use-location";

import { BannerLink } from "../banner";

import type { FC, PropsWithChildren } from "react";
import type { InlineLinkProps } from "~/components/inline-link";

export const SelfLink: FC<
	PropsWithChildren<
		Omit<InlineLinkProps, "href"> & { query?: Record<string, string | null> }
	>
> = ({ children, query, ...props }) => {
	const location = useLocation();

	const url = new URL(location.href);
	if (query)
		Object.entries(query).map(([key, value]) => {
			if (value === null) return url.searchParams.delete(key);
			url.searchParams.set(key, value);
		});

	return (
		<BannerLink href={url.href} {...props}>
			{children}
		</BannerLink>
	);
};
