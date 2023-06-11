import { twMerge } from "tailwind-merge";

import { Pill } from "./pill";

import { PartialAttribute } from "~/api/attributes";
import { findBy, sortBy } from "~/utilities";
import { withAttributeList } from "~/api/attributes-server";

export interface GenderPillsProps {
	simple?: boolean;
	attributes: Array<PartialAttribute>;
	className?: string;
	small?: boolean;
}

export async function GenderPills({
	simple = false,
	attributes,
	className,
	small
}: GenderPillsProps) {
	const genders = await withAttributeList("gender");

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

	if (visibleGenders.length === 0)
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		visibleGenders.push(genders.find(({ metadata }) => metadata.fallback)!);

	return (
		<>
			{visibleGenders.map((gender, genderIndex) => (
				<Pill
					hocusable={false}
					key={gender.id}
					small={small}
					className={twMerge(
						className,
						genderIndex !== 0 && small && simple && "hidden sm:flex"
					)}
				>
					{gender.name}
				</Pill>
			))}
		</>
	);
}
