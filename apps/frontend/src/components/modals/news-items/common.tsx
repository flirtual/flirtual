/* eslint-disable react-refresh/only-export-components */
import type { ComponentProps, FC } from "react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import {
	Dialog,
	DialogContent
} from "~/components/dialog/dialog";
import { Image } from "~/components/image";
import { InlineLink } from "~/components/inline-link";
import { IdeasLink } from "~/components/modals/ideas";
import { urls } from "~/urls";

export const ExpandableImage: FC<ComponentProps<typeof Image>> = (props) => {
	const [open, setOpen] = useState(false);
	const { t } = useTranslation();

	return (
		<>
			<button
				className="cursor-zoom-in"
				type="button"
				onClick={() => setOpen(true)}
			>
				<Image {...props} />
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent border={false} className="pointer-events-none w-fit bg-transparent p-0 shadow-none desktop:max-w-fit">
					<img
						alt={props.alt ?? t("profile_picture")}
						className="mx-auto max-h-[95svh] max-w-[95svw] rounded-2.5xl object-contain shadow-brand-1 ring-4 ring-theme-1"
						src={props.src}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};

export const commonComponents = {
	p: <p className="select-children" />,
	ul: <ul className="select-children flex list-outside list-disc flex-col gap-1.5 pl-6" />,
	li: <li />,
	h2: <h2 className="select-text font-montserrat text-lg font-semibold" />,
	footer: (
		<Trans
			components={{
				p: <p className="select-children" />,
				discord: <InlineLink href={urls.socials.discord} />,
				vrchat: <InlineLink href={urls.socials.vrchat} />,
				ideas: <IdeasLink />,
				contact: <InlineLink href={urls.resources.contact} />,
				github: <InlineLink href={urls.resources.developers} />
			}}
			i18nKey="news.footer"
		/>
	),
	discord: <InlineLink href={urls.socials.discord} />,
	contact: <InlineLink href={urls.resources.contact} />,
	github: <InlineLink href={urls.resources.developers} />,
	premium: <InlineLink href={urls.subscription.default} />,
	browse: <InlineLink href={urls.discover("dates")} />,
	homies: <InlineLink href={urls.discover("homies")} />,
	matches: <InlineLink href={urls.conversations.list()} />,
	events: <InlineLink href={urls.resources.events} />,
	about: <InlineLink href={urls.resources.about} />,
	me: <InlineLink href={urls.user.me} />,
	bio: <InlineLink href={urls.settings.bio} />,
	info: <InlineLink href={urls.settings.info()} />,
	interests: <InlineLink href={urls.settings.interests} />,
	connections: <InlineLink href={urls.settings.connections} />,
	matchmaking: <InlineLink href={urls.settings.matchmaking()} />,
	notifications: <InlineLink href={urls.settings.notifications} />,
	appearance: <InlineLink href={urls.settings.appearance} />,
	password: <InlineLink href={urls.settings.password} />,
	apps: <InlineLink href={urls.resources.download} />,
	appstore: <InlineLink href={urls.apps.apple} />,
	playstore: <InlineLink href={urls.apps.google} />,
	sidequest: <InlineLink href={urls.apps.sideQuest} />
};
