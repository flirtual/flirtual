import { twMerge } from "tailwind-merge";
import { FC } from "react";

import { PartialAttribute } from "~/api/attributes";
import { findBy, sortBy } from "~/utilities";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { InlineLink } from "~/components/inline-link";
import { useAttributeList } from "~/hooks/use-attribute-list";

import { Pill } from "./pill";

export interface GenderPillsProps {
	simple?: boolean;
	attributes: Array<PartialAttribute>;
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

	const profileGenders = attributes
		.map(({ id }) => findBy(genders, "id", id))
		.filter(Boolean);
	const visibleGenders = sortBy(
		[
			...new Set(
				simple
					? profileGenders
							.map((gender) =>
								gender.metadata.aliasOf
									? findBy(genders, "id", gender.metadata.aliasOf) ?? gender
									: gender
							)
							.filter((gender) => {
								if (simple)
									return gender.metadata.simple || gender.metadata.fallback;
								return true;
							})
					: profileGenders
			)
		],
		"order"
	);

	if (visibleGenders.length === 0) {
		const fallback = genders.find(({ metadata }) => metadata.fallback);
		if (fallback) visibleGenders.push(fallback);
	}

	return (
		<>
			{visibleGenders.map((gender, genderIndex) => (
				<Tooltip key={gender.id}>
					<TooltipTrigger asChild>
						<div>
							<Pill
								hocusable={false}
								small={small}
								className={twMerge(
									className,
									genderIndex !== 0 && small && simple && "hidden sm:flex"
								)}
							>
								{gender.name}
							</Pill>
						</div>
					</TooltipTrigger>
					{(gender.metadata.definition || gender.metadata.definitionLink) && (
						<TooltipContent>
							{gender.metadata.definition}{" "}
							<InlineLink
								className="pointer-events-auto"
								href={gender.metadata.definitionLink}
							>
								Learn more
							</InlineLink>
						</TooltipContent>
					)}
				</Tooltip>
			))}
		</>
	);
};
