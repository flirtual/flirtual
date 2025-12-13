import { Trans } from "react-i18next";

import { InlineLink } from "~/components/inline-link";
import { IdeasLink } from "~/components/modals/ideas";
import { urls } from "~/urls";

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
