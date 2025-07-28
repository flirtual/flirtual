import { Chrome, RotateCw, Send, Smartphone, WifiOff } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import type { PropsWithChildren } from "react";
import { Trans, useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Image } from "~/components/image";
import { device } from "~/hooks/use-device";
import { useTimeout } from "~/hooks/use-interval";
import { urls } from "~/urls";

export function LoadingIndicator({ className, children }: PropsWithChildren<{ className?: string }>) {
	const [probablyErrored, setProbablyErrored] = useState(false);
	useTimeout(() => setProbablyErrored(true), "5s");

	const { t } = useTranslation();
	const native = device.native;

	return (
		<div className={twMerge("flex min-h-screen w-full flex-col items-center justify-center opacity-75", className)}>
			<div
				className="w-2/3 max-w-sm animate-pulse desktop:w-1/2"
				// initial={{ opacity: 0 }}
			>
				<Image
					priority
					alt=""
					className="hidden w-full vision:block dark:block"
					draggable={false}
					height={1000}
					src={urls.media("flirtual-white.svg", "static")}
					width={3468}
				/>
				<Image
					priority
					alt=""
					className="block w-full vision:hidden dark:hidden"
					draggable={false}
					height={1000}
					src={urls.media("flirtual-black.svg", "static")}
					width={3468}
				/>
			</div>
			<AnimatePresence>
				{probablyErrored && (
					<m.div
						key="too-long"
						animate={{ opacity: 1, y: 0 }}
						className="flex w-full max-w-md flex-col gap-4 px-4 pt-8"
						initial={{ opacity: 0, y: -20 }}
					>
						<p className="font-semibold">{t("crisp_lime_raven_arise")}</p>
						<ul className="ml-4 flex list-disc flex-col gap-2">
							<li>
								<Trans
									components={{
										icon: <WifiOff className="mr-1 inline-block size-4 shrink-0" />,
									}}
									i18nKey="tough_sleek_wasp_reside"
								/>
							</li>
							{native && (<li>{t("game_vexed_goldfish_dash")}</li>)}
							<li>
								<Trans
									components={{
										"browser-icon": <Chrome className="mr-1 inline-block size-4 shrink-0" />,
										"device-icon": <Smartphone className="mr-0.5 inline-block size-4 shrink-0" />
									}}
									i18nKey={native ? "sweet_strong_poodle_endure" : "heroic_pink_gull_breathe"}
								/>
							</li>
							<li>
								<button
									className="underline"
									type="button"
									onClick={() => location.reload()}
								>
									<RotateCw className="mr-1 inline-block size-4 shrink-0" />
									{t(native ? "refresh_the_app" : "refresh_the_page")}
								</button>
							</li>
							<li>
								<Trans
									components={{
										contact: (
											<a
												className="whitespace-nowrap lowercase underline"
												href={urls.resources.contact}
											>
												<Send className="mr-1 inline-block size-4 shrink-0" />
											</a>
										)
									}}
									i18nKey="yummy_salty_porpoise_greet"
								/>
							</li>
						</ul>
					</m.div>
				)}
			</AnimatePresence>
			{children}
		</div>
	);
}
