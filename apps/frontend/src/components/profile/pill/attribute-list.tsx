"use client";

import { FC } from "react";

import { Attribute, AttributeMetadata } from "~/api/attributes";
import { User } from "~/api/user";
import { useSession } from "~/hooks/use-session";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { InlineLink } from "~/components/inline-link";

import { Pill } from "./pill";

interface PillAttributeListProps {
	attributes?: Array<Attribute>;
	user: User;
	href?: string;
}

export const PillAttributeList: FC<PillAttributeListProps> = ({
	user,
	attributes,
	href
}) => {
	const [session] = useSession();
	if (!session || !attributes?.length) return null;

	const sessionAttributeIds = new Set(
		session.user.profile.attributes.map(({ id }) => id)
	);

	const attributeMatches = (
		id: string,
		type: string,
		metadata: unknown
	): boolean => {
		let targetId = id;
		if (type === "kink") {
			const kinkMetadata = metadata as AttributeMetadata["kink"];
			if (kinkMetadata.pair) targetId = kinkMetadata.pair;
		} else if (type === "language") {
			return session.user.profile.languages.includes(targetId);
		}
		return sessionAttributeIds.has(targetId);
	};

	return (
		<div className="flex w-full flex-wrap gap-2">
			{attributes.map(({ id, type, name, metadata }) => {
				const meta = metadata as {
					definition?: string;
					definitionLink?: string;
				};

				return (
					<Tooltip key={id}>
						<TooltipTrigger asChild>
							<div>
								<Pill
									href={href}
									active={
										session.user.id !== user.id &&
										attributeMatches(id, type, metadata)
									}
								>
									{name}
								</Pill>
							</div>
						</TooltipTrigger>
						{metadata !== undefined &&
							(meta.definition || meta.definitionLink) && (
								<TooltipContent>
									{meta.definition}{" "}
									{meta.definitionLink && (
										<InlineLink
											className="pointer-events-auto"
											href={meta.definitionLink}
										>
											Learn more
										</InlineLink>
									)}
								</TooltipContent>
							)}
					</Tooltip>
				);
			})}
		</div>
	);
};
