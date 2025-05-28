"use client";

import { Chrome, RotateCw, Send, Smartphone, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { type PropsWithChildren, useState } from "react";
import { twMerge } from "tailwind-merge";

import { device } from "~/hooks/use-device";
import { useTimeout } from "~/hooks/use-interval";
import { urls } from "~/urls";

export function LoadingIndicator({ className, children }: PropsWithChildren<{ className?: string }>) {
	const [probablyErrored, setProbablyErrored] = useState(false);
	useTimeout(() => setProbablyErrored(true), "10s");

	const t = useTranslations();
	const native = device.native;

	return (
		<div className={twMerge("flex min-h-screen w-full flex-col items-center justify-center opacity-75", className)}>
			<Image
				priority
				alt=""
				className="hidden w-2/3 max-w-sm animate-pulse vision:block dark:block desktop:w-1/2"
				draggable={false}
				height={1000}
				src={urls.media("flirtual-white.svg", "static")}
				width={3468}
			/>
			<Image
				priority
				alt=""
				className="block w-2/3 max-w-sm animate-pulse vision:hidden dark:hidden desktop:w-1/2"
				draggable={false}
				height={1000}
				src={urls.media("flirtual-black.svg", "static")}
				width={3468}
			/>
			{probablyErrored && (
				<div className="flex w-full max-w-md flex-col gap-4 px-4 pt-8">
					<p className="font-semibold">{t("crisp_lime_raven_arise")}</p>
					<ul className="ml-4 flex list-disc flex-col gap-2">
						<li>
							<button
								className="underline"
								type="button"
								onClick={() => location.reload()}
							>
								<RotateCw className="mr-1 inline-block size-4 shrink-0" />
								{t(native ? "refresh_the_app" : "refresh_the_page")}
							</button>
							.
						</li>
						{native && (<li>{t("game_vexed_goldfish_dash")}</li>)}
						<li>
							{t.rich(native ? "sweet_strong_poodle_endure" : "heroic_pink_gull_breathe", {
								"browser-icon": () => <Chrome className="inline-block size-4 shrink-0" />,
								"device-icon": () => <Smartphone className="inline-block size-4 shrink-0" />
							})}
						</li>
						<li>
							{t.rich("tough_sleek_wasp_reside", {
								icon: () => <WifiOff className="inline-block size-4 shrink-0" />
							})}
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
				</div>
			)}
			{children}
		</div>
	);
}
