"use client";

import { FC } from "react";

import { Attribute } from "~/api/attributes";
import { User } from "~/api/user";
import { useSession } from "~/hooks/use-session";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { InlineLink } from "~/components/inline-link";

import { Pill } from "./pill";

interface PillAttributeListProps {
	attributes?: Array<Attribute>;
	user: User;
	href?: string;
	activeIds?: Array<string>;
}

export const PillAttributeList: FC<PillAttributeListProps> = ({
	user,
	attributes,
	href,
	activeIds
}) => {
	const [session] = useSession();
	if (!session || !attributes?.length) return null;
	const attributeIds =
		activeIds || session.user.profile.attributes.map(({ id }) => id);

	return (
		<div className="flex w-full flex-wrap gap-2">
			{attributes.map(({ id, name, metadata }) => {
				const meta = metadata as {
					definition?: string;
					definitionLink?: string;
				};

				return (
					<Tooltip key={id}>
						<TooltipTrigger asChild>
							<div>
								<Pill
									active={session.user.id !== user.id && attributeIds.includes(id)}
									href={href}
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
