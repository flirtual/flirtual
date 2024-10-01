"use client";

import { twMerge } from "tailwind-merge";
import { useTranslations } from "next-intl";

import { findBy } from "~/utilities";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { InlineLink } from "~/components/inline-link";
import {
	useAttributeList,
	useAttributeTranslation
} from "~/hooks/use-attribute-list";

import { Pill } from "./pill";

import type { FC } from "react";

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
	const genders = useAttributeList("gender");
	const t = useTranslations();

	const tAttributes = useAttributeTranslation("gender");

	const profileGenders = attributes
		.map((id) => findBy(genders, "id", id))
		.filter(Boolean);

	const visibleGenders = [
		...new Set(
			simple
				? profileGenders
						.map((gender) =>
							gender.aliasOf
								? (findBy(genders, "id", gender.aliasOf) ?? gender)
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
								hocusable={false}
								small={small}
								className={twMerge(
									className,
									genderIndex !== 0 && small && simple && "hidden desktop:flex"
								)}
							>
								{name}
							</Pill>
						</TooltipTrigger>
						{(definition || gender.definitionLink) && (
							<TooltipContent>
								{definition}{" "}
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
