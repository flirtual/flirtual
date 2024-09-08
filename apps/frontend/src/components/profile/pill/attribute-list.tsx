"use client";

import { useMessages, useTranslations } from "next-intl";

import { useSession } from "~/hooks/use-session";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { InlineLink } from "~/components/inline-link";

import { Pill } from "./pill";

import type { AttributeType, MinimalAttribute } from "~/api/attributes";
import type { User } from "~/api/user";
import type { FC } from "react";

interface PillAttributeListProps {
	attributes?: Array<MinimalAttribute<AttributeType>>;
	user: User;
	href?: string;
	activeIds?: Array<string>;
}

export const PillAttributeList: FC<PillAttributeListProps> = ({
	user,
	attributes: attributeIds,
	href,
	activeIds
}) => {
	const [session] = useSession();
	const t = useTranslations();
	const { attributes: tAttributes } = useMessages() as {
		attributes: Record<string, { name: string; definition?: string }>;
	};

	if (!attributeIds?.length) return null;
	if (!activeIds)
		activeIds = Object.values(session?.user.profile.attributes || {}).flat();

	return (
		<div className="flex w-full flex-wrap gap-2">
			{attributes.map((attribute) => {
				const { id, ...metadata } =
					typeof attribute === "object" ? attribute : { id: attribute };
				const meta = metadata as {
					definition?: string;
					definitionLink?: string;
				};

				return (
					<Tooltip key={id}>
						<TooltipTrigger asChild>
							<div>
								<Pill
									className="vision:bg-white-30/70"
									href={href}
									active={
										session
											? session.user.id !== user.id && attributeIds.includes(id)
											: false
									}
								>
									{t(`attributes.${id}.name`)}
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
