import { MoveLeft, MoveRight, RefreshCw, Undo2, X } from "lucide-react";
import { m } from "motion/react";
import type {
	FC,
} from "react";
import { useTranslation } from "react-i18next";

import type {
	ProspectKind,
} from "~/api/matchmaking";
import { Button } from "~/components/button";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { useDevice } from "~/hooks/use-device";
import { useQueue } from "~/hooks/use-queue";
import { useSession } from "~/hooks/use-session";
import { useDefaultTour } from "~/hooks/use-tour";

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

	return (
		<div className="flex gap-2">
			<Button
				className="disabled:opacity-50"
				disabled={!previous}
				Icon={MoveLeft}
				size="xs"
				onClick={backward}
			/>
			<Button
				className="disabled:opacity-50"
				Icon={RefreshCw}
				size="xs"
				onClick={invalidate}
			/>
			<Button
				className="disabled:opacity-50"
				disabled={!current}
				Icon={MoveRight}
				size="xs"
				onClick={forward}
			/>
		</div>
	);
};

function DefaultTour() {
	const { user } = useSession();
	const { vision } = useDevice();
	useDefaultTour(!user.moderatorMessage && !vision);

	return null;
}

export const QueueActions: FC<{
	kind: ProspectKind;
}> = ({ kind: mode }) => {
	const { t } = useTranslation();
	const {
		previous,
		like,
		pass,
		undo,
		mutating
	} = useQueue(mode);

	return (
		<>
			<DefaultTour />
			<div className="flex h-32 w-full items-center justify-center">
				<div className="fixed bottom-24 z-20 flex flex-col items-center justify-center gap-2">
					<QueueDebugger kind={mode} />
					<div className="flex items-center gap-2 text-white-10">
						<Tooltip>
							<TooltipTrigger asChild>
								<m.button
									id="undo-button"
									className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1 transition-all disabled:opacity-50"
									disabled={!previous || mutating}
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
						{mode === "love" && (
							<Tooltip>
								<TooltipTrigger asChild>
									<m.button
										id="like-button"
										className="flex items-center justify-center rounded-full bg-brand-gradient p-4 shadow-brand-1 transition-all disabled:opacity-50"
										disabled={mutating}
										type="button"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => like()}
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
									className="flex items-center justify-center rounded-full bg-gradient-to-tr from-theme-friend-1 to-theme-friend-2 p-4 shadow-brand-1 transition-all disabled:opacity-50"
									disabled={mutating}
									type="button"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => like("friend")}
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
									className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1 transition-all disabled:opacity-50"
									disabled={mutating}
									type="button"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => pass()}
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
		</>
	);
};
