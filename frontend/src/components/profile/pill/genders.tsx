"use client";

import { PartialAttribute } from "~/api/attributes";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { findBy } from "~/utilities";

import { Pill } from "./pill";

export interface GenderPillsProps {
	simple?: boolean;
	attributes: Array<PartialAttribute>;
}

export const GenderPills: React.FC<GenderPillsProps> = ({ simple = false, attributes }) => {
	const genders = useAttributeList("gender");

	return (
		<>
			{attributes
				.map(({ id }) => findBy(genders, "id", id))
				.filter((gender) => (simple ? gender?.metadata?.simple : !gender?.metadata?.fallback))
				.sort((a, b) => {
					if (a?.metadata?.order || b?.metadata?.order)
						return (a?.metadata?.order ?? 0) > (b?.metadata?.order ?? 0) ? 1 : -1;
					return 0;
				})
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
};
