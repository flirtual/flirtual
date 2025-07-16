import { Chrome, Laptop, RotateCw, Send, Smartphone, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type PropsWithChildren, useState } from "react";
import { useTranslation } from "react-i18next";
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
				className="w-2/3 max-w-sm desktop:w-1/2 animate-pulse"
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
					<motion.div
						animate={{ opacity: 1, y: 0 }}
						className="flex w-full max-w-md flex-col gap-4 px-4 pt-8"
						initial={{ opacity: 0, y: -20 }}
						key="too-long"
					>
						<p className="font-semibold">{t("crisp_lime_raven_arise")}</p>
						<ul className="ml-4 flex list-disc flex-col gap-2">
							<li>
								{t.rich("tough_sleek_wasp_reside", {
									icon: () => <WifiOff className="inline-block size-4 shrink-0" />
								})}
							</li>
							{native && (<li>{t("game_vexed_goldfish_dash")}</li>)}
							<li>
								{t.rich(native ? "sweet_strong_poodle_endure" : "heroic_pink_gull_breathe", {
									"browser-icon": () => <Chrome className="inline-block size-4 shrink-0" />,
									"device-icon": () => {
										const Icon = device.platform === "web"
											? Laptop
											: Smartphone;

										return <Icon className="inline-block size-4 shrink-0" />;
									}
								})}
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
								{t.rich("yummy_salty_porpoise_greet", {
									contact: (children) => (
										<a
											className="whitespace-nowrap lowercase underline"
											href={urls.resources.contact}
										>
											<Send className="mr-1 inline-block size-4 shrink-0" />
											{children}
										</a>
									)
								})}
							</li>
						</ul>
					</motion.div>
				)}
			</AnimatePresence>
			{children}
		</div>
	);
}
