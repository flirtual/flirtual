import { MoveLeft, MoveRight, RefreshCw, Undo2, X } from "lucide-react";
import { m } from "motion/react";
import ms from "ms.macro";
import { useCallback, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type {
	ProspectKind,
} from "~/api/matchmaking";
import { Button } from "~/components/button";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import { useTimeout } from "~/hooks/use-interval";
import { useQueue } from "~/hooks/use-queue";
import { useSession } from "~/hooks/use-session";

function Key({ label }: { label: string }) {
	return (
		<kbd className="mb-0.5 inline-block size-7 rounded-md bg-white-20 pt-0.5 text-center font-nunito font-bold text-black-60 shadow-[0_1px_1px_2px_rgba(255,255,255,0.75)] dark:bg-black-60 dark:text-white-20">
			{label}
		</kbd>
	);
}

const QueueDebugger: FC<{ kind: ProspectKind }> = ({ kind }) => {
	const {
		next: [current],
		previous,
		forward,
		backward,
		invalidate
	} = useQueue(kind);

	const { user: { tags } } = useSession();
	if (!tags?.includes("debugger")) return null;

	return (
		<div className="flex gap-2">
			<Button
				className="disabled:brightness-90"
				disabled={!previous}
				Icon={MoveLeft}
				size="xs"
				onClick={backward}
			/>
			<Button
				className="disabled:brightness-90"
				Icon={RefreshCw}
				size="xs"
				onClick={invalidate}
			/>
			<Button
				className="disabled:brightness-90"
				disabled={!current}
				Icon={MoveRight}
				size="xs"
				onClick={forward}
			/>
		</div>
	);
};

export const QueueActions: FC<{
	kind: ProspectKind;
	explicitUserId?: string;
}> = ({ kind: mode, explicitUserId }) => {
	const { t } = useTranslation();
	const {
		previous,
		like,
		pass,
		undo,
		mutating
	} = useQueue(mode);

	const [didAction, setDidAction] = useState(false);

	if (mutating && !didAction) setDidAction(true);
	useTimeout(() => setDidAction(false), ms("1s"), didAction);

	const tooFast = mutating || didAction;

	useGlobalEventListener(
		"document",
		"keydown",
		useCallback(
			(event) => {
				if (document.querySelector("[data-radix-focus-guard]") || event.ctrlKey || event.metaKey || tooFast)
					return;

				if (event.key === "h" && previous) void undo();
				if (event.key === "j") void like();
				if (event.key === "k") void like("friend");
				if (event.key === "l") void pass();
			},
			[like, pass, undo, previous, tooFast]
		)
	);

	return (
		<div className="flex h-20 w-full items-center justify-center">
			<div className="fixed bottom-[max(calc(var(--safe-area-inset-bottom,0rem)+5.5rem),6rem)] z-20 flex flex-col items-center justify-center gap-2 desktop:bottom-12">
				<QueueDebugger kind={mode} />
				<div className="flex items-center gap-2 text-white-10">
					{!explicitUserId && (
						<Tooltip>
							<TooltipTrigger asChild>
								<m.button
									id="undo-button"
									className="flex h-fit items-center rounded-full border border-black-50/25 bg-white-30 p-3 text-black-50 shadow-brand-1 transition-all disabled:!scale-100 disabled:text-black-10 dark:bg-black-50 dark:text-white-10 dark:disabled:text-black-10"
									disabled={!previous || tooFast}
									type="button"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => undo()}
								>
									<Undo2 className="size-7" strokeWidth={3} />
								</m.button>
							</TooltipTrigger>
							<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
								<span className="pt-1">{t("undo")}</span>
								<Key label="H" />
							</TooltipContent>
						</Tooltip>
					)}
					{mode === "love" && (
						<Tooltip>
							<TooltipTrigger asChild>
								<m.button
									id="like-button"
									className="flex items-center justify-center rounded-full border border-black-50/25 bg-brand-gradient p-4 shadow-brand-1 transition-all disabled:brightness-90 dark:disabled:brightness-[80%]"
									disabled={tooFast}
									type="button"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => like("love", explicitUserId)}
								>
									<HeartIcon
										className="w-[2.125rem] shrink-0"
										gradient={false}
									/>
								</m.button>
							</TooltipTrigger>
							<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
								<span className="pt-1">{t("like")}</span>
								<Key label="J" />
							</TooltipContent>
						</Tooltip>
					)}
					<Tooltip>
						<TooltipTrigger asChild>
							<m.button
								id="friend-button"
								className="flex items-center justify-center rounded-full border border-black-50/25 bg-gradient-to-tr from-theme-friend-1 to-theme-friend-2 p-4 shadow-brand-1 transition-all disabled:brightness-90 dark:disabled:brightness-[80%]"
								disabled={tooFast}
								type="button"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => like("friend", explicitUserId)}
							>
								<PeaceIcon
									className="w-[2.125rem] shrink-0"
									gradient={false}
								/>
							</m.button>
						</TooltipTrigger>
						<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
							<span className="pt-1">{t("homie")}</span>
							<Key label={mode === "love" ? "K" : "J"} />
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<m.button
								id="pass-button"
								className="flex h-fit items-center rounded-full border border-black-90/25 bg-white-30 p-3 text-black-50 shadow-brand-1 transition-all disabled:!scale-100 disabled:text-black-10 dark:bg-black-50 dark:text-white-10 dark:disabled:text-black-10"
								disabled={tooFast}
								type="button"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => pass(undefined, explicitUserId)}
							>
								<X className="size-7" strokeWidth={3} />
							</m.button>
						</TooltipTrigger>
						<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
							<span className="pt-1">{t("pass")}</span>
							<Key label="L" />
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</div>
	);
};
