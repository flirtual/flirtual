import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { AttributeType, MinimalAttribute } from "~/api/attributes";
import { attributeId } from "~/api/attributes";
import type { User } from "~/api/user";
import { InlineLink } from "~/components/inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useOptionalSession } from "~/hooks/use-session";

import { Pill } from "./pill";
import { PillRows } from "./rows";

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
	const session = useOptionalSession();
	const { t } = useTranslation();
	const tAttributes = useAttributeTranslation();

	if (!attributes?.length) return null;
	if (!activeIds)
		activeIds = Object.values(session?.user.profile.attributes || {})
			.flat()
			.filter(Boolean);

	const highlighted = (attribute: MinimalAttribute<AttributeType>) =>
		!!session
		&& session.user.id !== user.id
		&& activeIds.includes(attributeId(attribute));

	const sortedAttributes = [...attributes].sort(
		(a, b) => Number(highlighted(b)) - Number(highlighted(a))
	);

	return (
		<PillRows editable={!!href}>
			{sortedAttributes.map((attribute) => {
				const id = attributeId(attribute);
				const { name, definition, definitionLink } = (tAttributes[id] ?? {}) as {
					name?: string;
					definition?: string;
					definitionLink?: string;
				};

				return (
					<Tooltip key={id}>
						<TooltipTrigger asChild>
							<div>
								<Pill
									active={highlighted(attribute)}
									className="vision:bg-white-30/70"
									href={href}
								>
									{getName?.(id) || name || id}
								</Pill>
							</div>
						</TooltipTrigger>
						{(definition || definitionLink) && (
							<TooltipContent>
								{definition}
								{" "}
								{definitionLink && (
									<InlineLink
										className="pointer-events-auto"
										href={definitionLink}
									>
										{t("learn_more")}
									</InlineLink>
								)}
							</TooltipContent>
						)}
					</Tooltip>
				);
			})}
		</PillRows>
	);
};
