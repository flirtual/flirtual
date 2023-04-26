import { PartialAttribute } from "~/api/attributes";
import { findBy } from "~/utilities";
import { withAttributeList } from "~/api/attributes-server";

import { Pill } from "./pill";

export interface GenderPillsProps {
	simple?: boolean;
	attributes: Array<PartialAttribute>;
}

export async function GenderPills({ simple = false, attributes }: GenderPillsProps) {
	const genders = await withAttributeList("gender");

	const profileGenders = attributes.map(({ id }) => findBy(genders, "id", id));
	const showFallbackGender = simple
		? true
		: profileGenders.every((gender) => !!gender?.metadata?.simple);

	return (
		<>
			{profileGenders
				.filter((gender) =>
					gender?.metadata?.fallback ? showFallbackGender : simple ? gender?.metadata?.simple : true
				)
				.map(
					(gender) =>
						gender && (
							<Pill hocusable={false} key={gender.id} small={true}>
								{gender.name}
							</Pill>
						)
				)}
		</>
	);
}
