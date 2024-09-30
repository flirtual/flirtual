/* eslint-disable @next/next/no-img-element */
"use client";

import { twMerge } from "tailwind-merge";
import { useLocale } from "next-intl";

import { Pill } from "./pill";

import type { FC } from "react";

export interface CountryPillProps {
	id: string;
	flagOnly?: boolean;
	className?: string;
}

export const CountryPill: FC<CountryPillProps> = ({
	id,
	flagOnly = false,
	className
}) => {
	const locale = useLocale();
	const countryNames = new Intl.DisplayNames([locale], { type: "region" });
	const countryName = countryNames.of(id);

	if (!countryName) return null;

	return (
		<Pill
			hocusable={false}
			small={true}
			className={twMerge(
				"shrink-0",
				flagOnly && "overflow-hidden p-0",
				className
			)}
		>
			<img
				src={`https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/4.1.4/flags/4x3/${id}.svg`}
				className={twMerge(
					"aspect-[4/3] h-8 w-max shrink-0",
					flagOnly ? "" : "-ml-4 rounded-l-xl"
				)}
			/>
			{!flagOnly && <span suppressHydrationWarning>{countryName}</span>}
		</Pill>
	);
};
