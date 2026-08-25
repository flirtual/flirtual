import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FC } from "react";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
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
import { useDismissed } from "~/hooks/use-dismissed";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import { useOptionalSession } from "~/hooks/use-session";
import { mutate, sessionKey } from "~/query";

import type { NewsFormSubmit } from "./news-items/form";
import { NewsFormContext } from "./news-items/form";
import { newsItems } from "./news-items/index";

export type NewsDialogProps
	= | { news: Array<string>; onClose: () => void }
		| { news?: undefined; onClose?: undefined };

type NewsAction = "close" | "next";

const NewsItem: FC<{
	id: string;
	active: boolean;
	onSaved?: () => void;
	onRegister: (id: string, submit: NewsFormSubmit | null) => void;
	onFormSaved: (id: string) => void;
}> = ({ id, active, onSaved, onRegister, onFormSaved }) => {
	const { Component } = newsItems[id]!;

	const registry = useMemo(
		() => ({
			register: (submit: NewsFormSubmit | null) => onRegister(id, submit),
			onSaved: () => onFormSaved(id)
		}),
		[id, onRegister, onFormSaved]
	);

	return (
		<div className={active ? "contents" : "hidden"}>
			<NewsFormContext value={registry}>
				{active
					? (
							<Component onSaved={onSaved} />
						)
					: (
							<Suspense>
								<Component />
							</Suspense>
						)}
			</NewsFormContext>
		</div>
	);
};

export const NewsDialog: FC<NewsDialogProps> = (props) => {
	const { t } = useTranslation();
	const session = useOptionalSession();
	const [tourCompleted] = useDismissed("tour_browsing");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [pendingAction, setPendingAction] = useState<NewsAction | null>(null);
	const [saving, setSaving] = useState(false);

	const submitters = useRef(new Map<string, NewsFormSubmit>());
	const savedItems = useRef(new Set<string>());
	const closing = useRef(false);
	const confirmReference = useRef<HTMLButtonElement>(null);

	const news = useMemo(() => {
		if (props.news) return props.news.filter((id) => newsItems[id]);

		if (!session?.user.news?.length) return [];
		if (!tourCompleted) return [];

		return session.user.news.filter((id) => newsItems[id]).toReversed();
	}, [props.news, session?.user.news, tourCompleted]);

	const newsKey = news.join();
	const [shownKey, setShownKey] = useState(newsKey);

	if (shownKey !== newsKey) {
		setShownKey(newsKey);
		setCurrentIndex(0);
		setPendingAction(null);
	}

	const registerForm = useCallback(
		(id: string, submit: NewsFormSubmit | null) => {
			if (submit) submitters.current.set(id, submit);
			else submitters.current.delete(id);
		},
		[]
	);

	const markFormSaved = useCallback((id: string) => {
		savedItems.current.add(id);
	}, []);

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

	const currentId = news[currentIndex]!;
	const dismissable = currentIndex >= news.length - 1;
	const closeOnEscapeOrOutside = dismissable && Boolean(props.news);

	const preventClose = (event: Event) => {
		if (closeOnEscapeOrOutside) return;
		event.preventDefault();
	};

	const handleClose = async () => {
		if (closing.current) return;
		closing.current = true;

		try {
			if (!props.news && session) {
				const updatedUser = await User.removeNews(session.user.id, news);
				await mutate<Session>(sessionKey(), (session) => session && { ...session, user: updatedUser });
			}
			props.onClose?.();
		}
		finally {
			closing.current = false;
		}
	};

	const performAction = async (action: NewsAction) => {
		if (action === "next") return setCurrentIndex((index) => index + 1);
		await handleClose();
	};

	const requestAction = (action: NewsAction) => {
		if (submitters.current.has(currentId) && !savedItems.current.has(currentId)) {
			setPendingAction(action);
			return;
		}

		void performAction(action);
	};

	return (
		<Suspense fallback={null}>
			<Dialog
				open
				onOpenChange={(open) => {
					if (open || !dismissable) return;
					requestAction("close");
				}}
			>
				<DialogContent
					className="outline-none desktop:max-w-xl"
					closable={dismissable}
					onEscapeKeyDown={preventClose}
					onInteractOutside={preventClose}
					onOpenAutoFocus={(event) => event.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{t(`news.${currentId}.title` as any)}</DialogTitle>
					</DialogHeader>
					<DialogBody className="max-h-[60svh] gap-4">
						{news.map((id, index) => (
							<NewsItem
								id={id}
								key={id}
								active={index === currentIndex}
								onFormSaved={markFormSaved}
								onRegister={registerForm}
								onSaved={news.length === 1 ? handleClose : undefined}
							/>
						))}

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
											<Button size="sm" onClick={() => requestAction("next")}>
												{t("next")}
												<ChevronRight className="size-4" />
											</Button>
										)
									: (
											<Button size="sm" onClick={() => requestAction("close")}>
												{t("close")}
											</Button>
										)}
							</div>
						)}
					</DialogBody>
				</DialogContent>
			</Dialog>

			<Dialog
				open={pendingAction !== null}
				onOpenChange={(open) => !open && !saving && setPendingAction(null)}
			>
				<DialogContent
					className="desktop:max-w-sm"
					onOpenAutoFocus={(event) => {
						event.preventDefault();
						confirmReference.current?.focus();
					}}
				>
					<DialogHeader>
						<DialogTitle>{t("unsaved_settings")}</DialogTitle>
					</DialogHeader>
					<DialogBody>
						<div className="flex flex-col gap-4">
							<span>{t("save_settings_confirmation")}</span>
							<div className="flex gap-2">
								<Button
									className="grow basis-0"
									disabled={saving}
									kind="secondary"
									size="sm"
									onClick={() => {
										const action = pendingAction;
										setPendingAction(null);

										if (action) void performAction(action);
									}}
								>
									{t("no")}
								</Button>
								<Button
									className="grow basis-0"
									disabled={saving}
									pending={saving}
									ref={confirmReference}
									size="sm"
									onClick={async () => {
										const action = pendingAction;
										const submit = submitters.current.get(currentId);

										if (!action || !submit) return setPendingAction(null);

										setSaving(true);
										const saved = await submit();
										setSaving(false);
										setPendingAction(null);

										if (saved) await performAction(action);
									}}
								>
									{t("yes")}
								</Button>
							</div>
						</div>
					</DialogBody>
				</DialogContent>
			</Dialog>
		</Suspense>
	);
};
