import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FC } from "react";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Session } from "~/api/auth";
import { User } from "~/api/user";
import { Button } from "~/components/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import { usePreferences } from "~/hooks/use-preferences";
import { useOptionalSession, useSession } from "~/hooks/use-session";
import { mutate, sessionKey } from "~/query";

import { newsItems } from "./news-items/index";

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

		return session.user.news.filter((id) => newsItems[id]).toReversed();
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

	return (
		<Suspense fallback={null}>
			<Dialog open onOpenChange={(open) => !open && currentIndex >= news.length - 1 && handleClose()}>
				<DialogContent className="desktop:max-w-xl" closable={currentIndex >= news.length - 1}>
					<DialogHeader>
						<DialogTitle>{t(`news.${news[currentIndex]}.title` as any)}</DialogTitle>
					</DialogHeader>
					<DialogBody className="max-h-[60svh] gap-4">
						{news.map((id, index) => {
							const Component = newsItems[id].Component;
							const isActive = index === currentIndex;

							return (
								<div key={id} className={isActive ? "contents" : "hidden"}>
									{isActive
										? (
												<Component onSaved={news.length === 1 ? handleClose : undefined} />
											)
										: (
												<Suspense>
													<Component />
												</Suspense>
											)}
								</div>
							);
						})}

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
		</Suspense>
	);
};
