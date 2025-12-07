/* eslint-disable react-refresh/only-export-components */
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import ImageHomiesDay1 from "virtual:remote/static/news/homies-day-1.png";
import ImageHomiesDay2 from "virtual:remote/static/news/homies-day-2.png";
import ImageMobileApps from "virtual:remote/static/news/mobile-apps.png";
import ImageProfileUpdates from "virtual:remote/static/news/profile-updates.png";
import ImageWrapped from "virtual:remote/static/news/wrapped.png";

import type { Session } from "~/api/auth";
import { User } from "~/api/user";
import { Profile, ProfileRelationshipList } from "~/api/user/profile";
import { Button } from "~/components/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { Image } from "~/components/image";
import { InlineLink } from "~/components/inline-link";
import { InputLabel } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import { usePreferences } from "~/hooks/use-preferences";
import { useOptionalSession, useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, mutate, sessionKey } from "~/query";
import { urls } from "~/urls";

const NewsFooter: FC = () => (
	<Trans
		components={{
			p: <p className="select-children" />,
			discord: <InlineLink href={urls.socials.discord} />,
			vrchat: <InlineLink href={urls.socials.vrchat} />,
			feedback: <InlineLink href={urls.resources.feedback} />,
			contact: <InlineLink href={urls.resources.contact} />,
			github: <InlineLink href={urls.resources.developers} />
		}}
		i18nKey="news.footer"
	/>
);

const commonComponents = {
	p: <p className="select-children" />,
	ul: <ul className="select-children flex list-outside list-disc flex-col gap-1.5 pl-6" />,
	li: <li />,
	h2: <h2 className="select-text font-montserrat text-lg font-semibold" />,
	footer: <NewsFooter />,
	discord: <InlineLink href={urls.socials.discord} />,
	feedback: <InlineLink href={urls.resources.feedback} />,
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

export interface NewsItem {
	date: string;
	Component: FC<{ onSaved?: () => void }>;
}

export const newsItems: Record<string, NewsItem> = {
	catch_up: {
		date: "2025-12-07",
		Component: ({ onSaved }) => {
			const { t } = useTranslation();
			const toasts = useToast();
			const { user } = useSession();

			return (
				<Trans
					components={{
						...commonComponents,
						form: (
							<Form
								fields={{
									relationships: user.profile.relationships ?? []
								}}
								className="mb-2 flex flex-col gap-4"
								onSubmit={async (values) => {
									await Profile.update(user.id, {
										required: ["relationships"],
										relationships: values.relationships ?? []
									});
									await invalidate({ queryKey: sessionKey() });
									toasts.add(t("saved"));
									onSaved?.();
								}}
							>
								{({ FormField }) => (
									<>
										<FormField name="relationships">
											{(field) => (
												<>
													<InputLabel>{t("im_open_to")}</InputLabel>
													<InputCheckboxList
														{...field.props}
														items={ProfileRelationshipList.map((item) => ({
															key: item,
															label: t(({
																serious: "serious_dating_hint",
																vr: "casual_dating_hint",
																hookups: "hookups_hint",
																friends: "new_friends"
															} as const)[item])
														}))}
													/>
												</>
											)}
										</FormField>
										<FormButton>{t("save")}</FormButton>
									</>
								)}
							</Form>
						)
					}}
					i18nKey="news.catch_up.body"
				/>
			);
		}
	},
	"2024_wrapped": {
		date: "2025-01-01",
		Component: () => (
			<Trans
				components={{
					...commonComponents,
					"image-wrapped": (
						<Image className="w-full rounded-lg" src={ImageWrapped} />
					)
				}}
				i18nKey="news.2024_wrapped.body"
			/>
		)
	},
	"2024_100k": {
		date: "2024-10-01",
		Component: () => (
			<Trans
				components={{
					...commonComponents,
					"image-profile-updates": (
						<Image className="w-full rounded-lg" src={ImageProfileUpdates} />
					)
				}}
				i18nKey="news.2024_100k.body"
			/>
		)
	},
	"2024_homies_day": {
		date: "2024-02-14",
		Component: () => (
			<Trans
				components={{
					...commonComponents,
					"image-homies-day-1": (
						<Image className="w-full" src={ImageHomiesDay1} />
					),
					"image-homies-day-2": (
						<Image className="w-full" src={ImageHomiesDay2} />
					)
				}}
				i18nKey="news.2024_homies_day.body"
			/>
		)
	},
	"2023_apps_themes": {
		date: "2023-10-19",
		Component: () => (
			<Trans
				components={{
					...commonComponents,
					"image-mobile-apps": (
						<Image className="w-full" src={ImageMobileApps} />
					)
				}}
				i18nKey="news.2023_apps_themes.body"
			/>
		)
	},
	"2023_matchmaking": {
		date: "2023-06-15",
		Component: () => (
			<Trans
				components={commonComponents}
				i18nKey="news.2023_matchmaking.body"
			/>
		)
	},
	"2023_rewrite": {
		date: "2023-04-28",
		Component: () => (
			<Trans
				components={commonComponents}
				i18nKey="news.2023_rewrite.body"
			/>
		)
	}
};

export const newsItemsOrdered = [
	"relationship",
	"wrapped",
	"profile_updates",
	"homies_day",
	"mobile_apps",
	"matchmaking",
	"welcome"
] as const;

export type NewsDialogProps
	= | { news: Array<string>; onClose: () => void }
		| { news?: undefined; onClose?: undefined };

export const NewsDialog: FC<NewsDialogProps> = (props) => {
	const { t } = useTranslation();
	const session = useOptionalSession();
	const { user } = useSession();
	const [tourCompleted] = usePreferences("tour-browsing-completed", false);
	const [currentIndex, setCurrentIndex] = useState(0);
	const news = useMemo(() => {
		if (props.news) return props.news.filter((id) => newsItems[id]);

		if (!session?.user.news?.length) return [];
		if (!tourCompleted) return [];

		return session.user.news.filter((id) => newsItems[id]);
	}, [props.news, session?.user.news, tourCompleted]);

	useGlobalEventListener(
		"document",
		"keydown",
		useCallback(
			(event: KeyboardEvent) => {
				if (event.ctrlKey || event.metaKey) return;

				if (event.key === "ArrowLeft" && currentIndex > 0) {
					setCurrentIndex((index) => index - 1);
				}
				if (event.key === "ArrowRight" && currentIndex < news.length - 1) {
					setCurrentIndex((index) => index + 1);
				}
			},
			[currentIndex, news.length]
		),
		news.length > 1
	);

	if (news.length === 0 || !newsItems[news[currentIndex]]) return null;

	const handleClose = async () => {
		if (!props.news) {
			const updatedUser = await User.removeNews(user.id, news);
			await mutate<Session>(sessionKey(), (session) => session && { ...session, user: updatedUser });
		}
		props.onClose?.();
	};

	const CurrentComponent = newsItems[news[currentIndex]].Component;

	return (
		<Dialog open onOpenChange={(open) => !open && currentIndex >= news.length - 1 && handleClose()}>
			<DialogContent className="desktop:max-w-xl" closable={currentIndex >= news.length - 1}>
				<DialogHeader>
					<DialogTitle>{t(`news.${news[currentIndex]}.title` as any)}</DialogTitle>
				</DialogHeader>
				<DialogBody className="max-h-[60svh] gap-4">
					<CurrentComponent onSaved={news.length === 1 ? handleClose : undefined} />

					{news.length > 1 && (
						<div className="relative flex items-center justify-between gap-2 pt-2">
							{currentIndex > 0
								? (
										<Button
											kind="tertiary"
											size="sm"
											onClick={() => setCurrentIndex((index) => index - 1)}
										>
											<ChevronLeft className="size-4" />
											{t("previous")}
										</Button>
									)
								: <div />}

							<div className="absolute left-1/2 flex -translate-x-1/2 gap-1.5">
								{news.map((id, index) => (
									<button
										key={id}
										className={`focusable size-2 rounded-full transition-colors ${
											index === currentIndex ? "bg-theme-2" : "bg-white-40 dark:bg-black-40"
										}`}
										tabIndex={-1}
										type="button"
										onClick={() => setCurrentIndex(index)}
									/>
								))}
							</div>

							{currentIndex < news.length - 1
								? (
										<Button
											size="sm"
											onClick={() => setCurrentIndex((index) => index + 1)}
										>
											{t("next")}
											<ChevronRight className="size-4" />
										</Button>
									)
								: (
										<Button size="sm" onClick={handleClose}>
											{t("close")}
										</Button>
									)}
						</div>
					)}
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};
