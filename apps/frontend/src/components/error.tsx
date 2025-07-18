import { Chrome, RotateCw, Send, Smartphone, WifiOff } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { maintenance } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { useInterval } from "~/hooks/use-interval";
import { useLocale } from "~/i18n";
import { urls } from "~/urls";

import { CopyClick } from "./copy-click";
import { Image } from "./image";

const translations = {
	en: {
		title: maintenance
			? "Flirtual is temporarily unavailable."
			: "It looks like we're having issues",
		subtitle: maintenance
			? "But we'll be right back—check back soon!"
			: undefined,
		reload: "Reload",
		discord: "Discord Community",
		contact: "Contact Support",
	},
	ja: {
		title: maintenance
			? "Firtualは定期メンテナンスのため一時的にオフラインになっています。"
			: "問題を抱えているようだ",
		subtitle: maintenance
			? "でも、またすぐに戻ってきますから、すぐにチェックしてください！"
			: undefined,
		reload: "リロード",
		discord: "Discordコミュニティ",
		contact: "サポートに連絡",
	},
} as const;

export function HavingIssues({ digest }: { digest?: string }) {
	const { t } = useTranslation();
	const [locale] = useLocale();

	const t2 = translations[locale];

	const { native } = useDevice();

	const reload = () => location.reload();

	// Automatic retry, as eventually, we'll be back online.
	useInterval(reload, "30s");

	return (
		<div className="flex flex-col items-center p-4">
			<Image
				priority
				alt=""
				className="pettable mx-auto mb-4 h-14 w-fit shrink-0 rotate-[10deg] desktop:mt-1 desktop:h-16"
				draggable={false}
				height={345}
				src={urls.media("b25d8377-7035-4a23-84f1-faa095fa8104")}
				width={412}
			/>
			<h1>{t2.title}</h1>
			{t2.subtitle && <h2 className="mb-2 text-sm desktop:text-base">{t2.subtitle}</h2>}
			<div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs desktop:text-sm">
				<span className="cursor-pointer text-theme-2" onClick={reload}>
					{t2.reload}
				</span>
				{" ⋅ "}
				<a className="text-theme-2" href={urls.socials.discord}>
					{t2.discord}
				</a>
				{" ⋅ "}
				<a className="text-theme-2" href={urls.resources.contact}>
					{t2.contact}
				</a>
			</div>
			{!maintenance && (
				<>
					<ul className="ml-4 mt-6 flex max-w-sm list-disc flex-col gap-2 text-sm desktop:max-w-md desktop:text-base">
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
							<Trans
								components={{
									"browser-icon": <Chrome className="mr-1 inline-block size-4 shrink-0" />,
									"device-icon": <Smartphone className="mr-0.5 inline-block size-4 shrink-0" />
								}}
								i18nKey={native ? "sweet_strong_poodle_endure" : "heroic_pink_gull_breathe"}
							/>
						</li>
						<li>
							<Trans
								components={{
									icon: <WifiOff className="mr-1 inline-block size-4 shrink-0" />,
								}}
								i18nKey="tough_sleek_wasp_reside"
							/>
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
					{digest && (
						<CopyClick value={digest}>
							<span className="mt-6 font-mono text-xs desktop:text-sm">{digest}</span>
						</CopyClick>
					)}
				</>
			)}
		</div>
	);
}
