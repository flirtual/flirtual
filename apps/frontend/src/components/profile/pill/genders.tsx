import { useSuspenseQuery } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { indexBy, prop } from "remeda";
import { twMerge } from "tailwind-merge";

import { gendersOptions } from "~/api/data";
import { InlineLink } from "~/components/inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useLocale } from "~/i18n";

import { Pill } from "./pill";

export interface GenderPillsProps {
	simple?: boolean;
	ids: Array<string>;
	className?: string;
	small?: boolean;
}

export const GenderPills: FC<GenderPillsProps> = ({
	simple = false,
	ids,
	className,
	small
}) => {
	const [locale] = useLocale();
	const { data: genders } = useSuspenseQuery(gendersOptions({ locale }));
	const keyedGenders = indexBy(genders, prop("id"));

	const { t } = useTranslation();

	const profileGenders = ids
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
							if (simple) return gender.simple || gender.default;
							return true;
						})
				: profileGenders
		)
	];

	visibleGenders.sort((a, b) =>
		genders.findIndex((gender) => gender.id === a.id)
		- genders.findIndex((gender) => gender.id === b.id)
	);

	if (visibleGenders.length === 0) {
		const defaultGender = genders.find((gender) => gender.default);
		if (defaultGender) visibleGenders.push(defaultGender);
	}

	return (
		<>
			{visibleGenders.map((gender, genderIndex) => {
				const { name, definition, definitionLink } = gender;
				if (!name) return null;

				return (
					<Tooltip key={gender.id}>
						<TooltipTrigger asChild>
							<div>
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
							</div>
						</TooltipTrigger>
						{(definition || definitionLink) && (
							<TooltipContent>
								{definition}
								{" "}
								{definitionLink && (
									<InlineLink
										className="pointer-events-auto"
										href={definitionLink}
									>
										{t("learn_more")}
									</InlineLink>
								)}
							</TooltipContent>
						)}
					</Tooltip>
				);
			})}
		</>
	);
};
