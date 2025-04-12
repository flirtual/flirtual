"use client";

import { useTranslations } from "next-intl";
import type { FC } from "react";

import type { AttributeType, MinimalAttribute } from "~/api/attributes";
import type { User } from "~/api/user";
import { InlineLink } from "~/components/inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useOptionalSession } from "~/hooks/use-session";

import { Pill } from "./pill";

interface PillAttributeListProps {
	attributes?: Array<MinimalAttribute<AttributeType>>;
	user: User;
	href?: string;
	activeIds?: Array<string>;
	getName?: (id: string) => string;
}

export const PillAttributeList: FC<PillAttributeListProps> = ({
	user,
	attributes,
	href,
	activeIds,
	getName
}) => {
	const [session] = useOptionalSession();
	const t = useTranslations();
	const tAttributes = useAttributeTranslation();

	if (!attributes?.length) return null;
	if (!activeIds)
		activeIds = Object.values(session?.user.profile.attributes || {})
			.flat()
			.filter(Boolean);

	return (
		<div className="flex w-full flex-wrap gap-2">
			{attributes.map((attribute) => {
				const { id, ...metadata }
					= typeof attribute === "object" ? attribute : { id: attribute };
				const meta = metadata as {
					definition?: string;
					definitionLink?: string;
				};

				return (
					<Tooltip key={id}>
						<TooltipTrigger asChild>
							<div>
								<Pill
									active={
										session
											? session.user.id !== user.id && activeIds.includes(id)
											: false
									}
									className="vision:bg-white-30/70"
									href={href}
								>
									{getName?.(id) || tAttributes[id]?.name || id}
								</Pill>
							</div>
						</TooltipTrigger>
						{metadata !== undefined
						&& (meta.definition || meta.definitionLink) && (
							<TooltipContent>
								{meta.definition}
								{" "}
								{meta.definitionLink && (
									<InlineLink
										className="pointer-events-auto"
										href={meta.definitionLink}
									>
										{t("learn_more")}
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
