"use client";

import { FC } from "react";

import { Attribute } from "~/api/attributes";
import { User } from "~/api/user";
import { useSession } from "~/hooks/use-session";

import { Pill } from "./pill";

interface PillAttributeListProps {
	attributes?: Array<Attribute>;
	user: User;
	href?: string;
}

export const PillAttributeList: FC<PillAttributeListProps> = ({ user, attributes, href }) => {
	const [session] = useSession();
	if (!session || !attributes?.length) return null;

	const sessionAttributeIds = session.user.profile.attributes.map(({ id }) => id);

	return (
		<div className="flex w-full flex-wrap gap-2">
			{attributes.map(({ id, name }) => (
				<Pill
					active={session.user.id !== user.id && sessionAttributeIds.includes(id)}
					href={href}
					key={id}
				>
					{name}
				</Pill>
			))}
		</div>
	);
};