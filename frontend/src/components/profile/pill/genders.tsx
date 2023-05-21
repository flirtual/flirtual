import { twMerge } from "tailwind-merge";

import { PartialAttribute } from "~/api/attributes";
import { findBy, sortBy } from "~/utilities";
import { withAttributeList } from "~/api/attributes-server";

import { Pill } from "./pill";

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

	const profileGenders = attributes.map(({ id }) => findBy(genders, "id", id)).filter(Boolean);
	const visibleGenders = sortBy(
		[
			...new Set(
				profileGenders
					.map((gender) =>
						gender.metadata.aliasOf
							? findBy(genders, "id", gender.metadata.aliasOf) ?? gender
							: gender
					)
					.filter((gender) => {
						if (simple) return gender.metadata.simple || gender.metadata.fallback;
						return true;
					})
			)
		],
		"order"
	);

	if (!visibleGenders.length)
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		visibleGenders.push(genders.find(({ metadata }) => metadata.fallback)!);

	return (
		<>
			{visibleGenders.map((gender, genderIdx) => (
				<Pill
					className={twMerge(className, genderIdx !== 0 && small && simple && "hidden sm:flex")}
					hocusable={false}
					key={gender.id}
					small={small}
				>
					{gender.name}
				</Pill>
			))}
		</>
	);
}
