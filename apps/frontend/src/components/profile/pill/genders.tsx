"use client";

import { useTranslations } from "next-intl";
import type { FC } from "react";
import { indexBy, prop } from "remeda";
import { twMerge } from "tailwind-merge";

import { InlineLink } from "~/components/inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";

import { Pill } from "./pill";

export interface GenderPillsProps {
	simple?: boolean;
	attributes: Array<string>;
	className?: string;
	small?: boolean;
}

export const GenderPills: FC<GenderPillsProps> = ({
	simple = false,
	attributes,
	className,
	small
}) => {
	const genders = useAttributes("gender");
	const keyedGenders = indexBy(genders, prop("id"));

	const t = useTranslations();

	const tAttributes = useAttributeTranslation("gender");

	const profileGenders = attributes
		.map((id) => keyedGenders[id])
		.filter(Boolean);

	const visibleGenders = [
		...new Set(
			simple
				? profileGenders
					.map((gender) =>
						gender.aliasOf
							? keyedGenders[gender.aliasOf] ?? gender
							: gender
					)
					.filter((gender) => {
						if (simple) return gender.simple || gender.fallback;
						return true;
					})
				: profileGenders
		)
	];

	if (visibleGenders.length === 0) {
		const fallback = genders.find(({ fallback }) => fallback);
		if (fallback) visibleGenders.push(fallback);
	}

	return (
		<>
			{visibleGenders.map((gender, genderIndex) => {
				const { name, definition } = tAttributes[gender.id] ?? {};
				if (!name) return null;

				return (
					<Tooltip key={gender.id}>
						<TooltipTrigger asChild>
							<Pill
								className={twMerge(
									className,
									genderIndex !== 0 && small && simple && "hidden desktop:flex"
								)}
								hocusable={false}
								small={small}
							>
								{name}
							</Pill>
						</TooltipTrigger>
						{(definition || gender.definitionLink) && (
							<TooltipContent>
								{definition}
								{" "}
								<InlineLink
									className="pointer-events-auto"
									href={gender.definitionLink}
								>
									{t("learn_more")}
								</InlineLink>
							</TooltipContent>
						)}
					</Tooltip>
				);
			})}
		</>
	);
};
