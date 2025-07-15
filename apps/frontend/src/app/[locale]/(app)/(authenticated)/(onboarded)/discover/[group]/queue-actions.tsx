"use client";

import { MoveLeft, MoveRight, RefreshCw, Undo2, X } from "lucide-react";
import { motion } from "motion/react";
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
import { useQueue } from "~/hooks/use-queue";

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

export const QueueActions: FC<{
	kind: ProspectKind;
}> = ({ kind: mode }) => {
	const { t } = useTranslation();
	const {
		previous,
		like,
		pass,
		undo
	} = useQueue(mode);

	return (
		<div className="flex h-32 w-full items-center justify-center">
			<div className="fixed bottom-24 z-20 flex flex-col items-center justify-center gap-2">
				<QueueDebugger kind={mode} />
				<div className="flex items-center gap-2 text-white-10">
					<Tooltip>
						<TooltipTrigger asChild>
							<motion.button
								className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1 transition-all disabled:opacity-50"
								disabled={!previous}
								id="undo-button"
								type="button"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => undo()}
							>
								<Undo2 className="size-7" strokeWidth={3} />
							</motion.button>
						</TooltipTrigger>
						<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
							<span className="pt-1">{t("undo")}</span>
							<Key label="H" />
						</TooltipContent>
					</Tooltip>
					{mode === "love" && (
						<Tooltip>
							<TooltipTrigger asChild>
								<motion.button
									className="flex items-center justify-center rounded-full bg-brand-gradient p-4 shadow-brand-1 transition-all disabled:opacity-50"
									id="like-button"
									type="button"
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => like()}
								>
									<HeartIcon
										className="w-[2.125rem] shrink-0"
										gradient={false}
									/>
								</motion.button>
							</TooltipTrigger>
							<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
								<span className="pt-1">{t("like")}</span>
								<Key label="J" />
							</TooltipContent>
						</Tooltip>
					)}
					<Tooltip>
						<TooltipTrigger asChild>
							<motion.button
								className="flex items-center justify-center rounded-full bg-gradient-to-tr from-theme-friend-1 to-theme-friend-2 p-4 shadow-brand-1 transition-all disabled:opacity-50"
								id="friend-button"
								type="button"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => like("friend")}
							>
								<PeaceIcon
									className="w-[2.125rem] shrink-0"
									gradient={false}
								/>
							</motion.button>
						</TooltipTrigger>
						<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
							<span className="pt-1">{t("homie")}</span>
							<Key label={mode === "love" ? "K" : "J"} />
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<motion.button
								className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1 transition-all disabled:opacity-50"
								id="pass-button"
								type="button"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => pass()}
							>
								<X className="size-7" strokeWidth={3} />
							</motion.button>
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

	return (

		<div className="h-[5.5rem] w-full desktop:h-0">
			<div className="pointer-events-none fixed bottom-[max(calc(var(--safe-area-inset-bottom,0rem)+3.375rem),4.5rem)] left-0 z-20 flex w-full flex-col items-center justify-center gap-3 px-2 pb-4 vision:bottom-2 desktop:bottom-0 desktop:py-8">
				<div className="pointer-events-auto flex items-center gap-1.5 overflow-hidden rounded-xl py-2 text-white-10 desktop:gap-3">
					{/* {!explicitUserId && (
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1 transition-all disabled:opacity-50"
									disabled={!Array.isArray(queue) || !queue[0]}
									id="undo-button"
									type="button"
									onClick={undo}
								>
									<Undo2 className="size-7" strokeWidth={3} />
								</button>
							</TooltipTrigger>
							<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
								<span className="pt-1">{t("undo")}</span>
								<Key label="H" />
							</TooltipContent>
						</Tooltip>
					)} */}
					<div className="flex flex-row items-center gap-1.5 desktop:gap-3">
						{mode === "love" && (
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										className="flex items-center justify-center rounded-full bg-brand-gradient p-4 shadow-brand-1 transition-all disabled:opacity-50"
										id="like-button"
										type="button"
										onClick={() => like()}
									>
										<HeartIcon
											className="w-[2.125rem] shrink-0"
											gradient={false}
										/>
									</button>
								</TooltipTrigger>
								<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
									<span className="pt-1">{t("like")}</span>
									<Key label="J" />
								</TooltipContent>
							</Tooltip>
						)}
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									className="flex items-center justify-center rounded-full bg-gradient-to-tr from-theme-friend-1 to-theme-friend-2 p-4 shadow-brand-1 transition-all disabled:opacity-50"
									id="friend-button"
									type="button"
									onClick={() => like("friend")}
								>
									<PeaceIcon
										className="w-[2.125rem] shrink-0"
										gradient={false}
									/>
								</button>
							</TooltipTrigger>
							<TooltipContent className="flex gap-3 px-3 py-1.5 native:hidden">
								<span className="pt-1">{t("homie")}</span>
								<Key label={mode === "love" ? "K" : "J"} />
							</TooltipContent>
						</Tooltip>
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								className="flex h-fit items-center rounded-full bg-black-60 p-3 shadow-brand-1 transition-all disabled:opacity-50"
								id="pass-button"
								type="button"
								onClick={() => pass()}
							>
								<X className="size-7" strokeWidth={3} />
							</button>
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
