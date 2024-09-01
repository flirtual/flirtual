"use client";

import { useLocation } from "~/hooks/use-location";

import { BannerLink } from "../banner";

import type { FC, PropsWithChildren } from "react";

export const SelfLink: FC<PropsWithChildren<{ preferred: string }>> = ({
	children,
	preferred
}) => {
	const location = useLocation();

	return (
		<BannerLink lang={preferred} href={location.href}>
			{children}
		</BannerLink>
	);
};
