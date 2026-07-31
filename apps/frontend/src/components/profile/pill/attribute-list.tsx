import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { AttributeType, MinimalAttribute } from "~/api/attributes";
import { attributeId } from "~/api/attributes";
import type { User } from "~/api/user";
import type { GameStoreLink } from "~/components/game-stores";
import { GameStoreLinks } from "~/components/game-stores";
import { InlineLink } from "~/components/inline-link";
import { Link } from "~/components/link";
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
	getLinks?: (id: string) => Array<GameStoreLink>;
}

export const PillAttributeList: FC<PillAttributeListProps> = ({
	user,
	attributes,
	href,
	activeIds,
	getName,
	getLinks
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

	const linksFor = (id: string) => (href ? [] : getLinks?.(id) ?? []);

	// Tags you share rank first. For games, ones that support your platforms rank
	// second.
	const sortedAttributes = [...attributes].sort(
		(a, b) =>
			Number(highlighted(b)) - Number(highlighted(a))
			|| Number(linksFor(attributeId(b)).length > 0)
			- Number(linksFor(attributeId(a)).length > 0)
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

				const label = getName?.(id) || name || id;
				const links = linksFor(id);

				return (
					<Tooltip key={id}>
						<TooltipTrigger asChild>
							<div>
								<Pill
									className={twMerge(
										"vision:bg-white-30/70",
										links.length > 0
										&& "cursor-pointer hocus-within:bg-brand-gradient hocus-within:text-theme-overlay"
									)}
									active={highlighted(attribute)}
									href={href}
								>
									{label}
									{links.length > 0 && (
										<>
											<Link
												aria-label={label}
												className="absolute inset-0 rounded-xl"
												href={links[0]!.href}
											/>
											<GameStoreLinks className="relative" links={links} />
										</>
									)}
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
