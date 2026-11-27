import { useSuspenseQuery } from "@tanstack/react-query";
import type { QueryKey, UseSuspenseQueryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { byId } from "~/api/data";
import type { User } from "~/api/user";
import type { GameStoreLink } from "~/components/game-stores";
import { GameStoreLinks } from "~/components/game-stores";
import { InlineLink } from "~/components/inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useOptionalSession } from "~/hooks/use-session";
import { useLocale } from "~/i18n";

import { Pill } from "./pill";
import { PillRows } from "./rows";

interface EntryText {
	id: string;
	name: string;
	definition?: string;
	definitionLink?: string;
}

interface PillEntryListProps<T extends EntryText, Key extends QueryKey> {
	options: (parameters: { locale: string }) => UseSuspenseQueryOptions<Array<T>, Error, Array<T>, Key>;
	ids?: Array<string>;
	user: User;
	href?: string;
	activeIds?: Array<string>;
	getName?: (id: string) => string;
	getLinks?: (id: string) => Array<GameStoreLink>;
}

export function PillEntryList<T extends EntryText, Key extends QueryKey>({
	options,
	user,
	ids,
	href,
	activeIds,
	getName,
	getLinks
}: PillEntryListProps<T, Key>) {
	const session = useOptionalSession();
	const { t } = useTranslation();
	const [locale] = useLocale();
	const { data: entries } = useSuspenseQuery({ ...options({ locale }), select: byId });

	if (!ids?.length) return null;
	const highlightedIds = activeIds ?? [];

	const highlighted = (id: string) =>
		!!session
		&& session.user.id !== user.id
		&& highlightedIds.includes(id);

	const linksFor = (id: string) => (href ? [] : getLinks?.(id) ?? []);

	// Tags you share rank first. For games, ones that support your platforms rank
	// second.
	const sortedIds = [...ids].sort(
		(a, b) =>
			Number(highlighted(b)) - Number(highlighted(a))
			|| Number(linksFor(b).length > 0)
			- Number(linksFor(a).length > 0)
	);

	return (
		<PillRows editable={!!href}>
			{sortedIds.map((id) => {
				const { name, definition, definitionLink } = entries[id] ?? {};

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
									active={highlighted(id)}
									href={href}
								>
									{label}
									<GameStoreLinks overlay stretched links={links} />
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
}
