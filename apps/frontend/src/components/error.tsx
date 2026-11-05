import { Clipboard } from "@capacitor/clipboard";
import * as Sentry from "@sentry/react-router";
import { AppWindow, Check, RotateCw, Send, Smartphone, WifiOff } from "lucide-react";
import ms from "ms" with { type: "macro" };
import { useMemo, useState } from "react";
import type { ComponentProps, FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import * as brand from "~/brand";
import { commitId, commitUrl, development, maintenance, preview, production, version } from "~/const";
import { device, useDevice } from "~/hooks/use-device";
import { useInterval } from "~/hooks/use-interval";
import { getSession } from "~/hooks/use-session";
import { useLocale } from "~/i18n";
import FlittyHardhat from "~/static/mascot-hardhat.png";
import { urls } from "~/urls";

import { Image } from "./image";

const translations = {
	en: {
		title: maintenance
			? `${brand.name} is temporarily unavailable.`
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
	}
} as const;

export function HavingIssues({ error }: { error?: unknown }) {
	const { t } = useTranslation();
	const [locale] = useLocale();

	const t2 = translations[locale];

	const { native } = useDevice();
	const [squishCount, setSquishCount] = useState(0);
	const [copied, setCopied] = useState(false);

	const eventId = useMemo(() => error ? Sentry.captureException(error) : null, [error]);

	const reload = () => location.reload();

	// Automatic retry, as eventually, we'll be back online.
	// eslint-disable-next-line react-hooks/rules-of-hooks
	if (production) useInterval(reload, ms("30s"));

	return (
		<div className="flex flex-col items-center p-4">
			<Image
				priority
				alt=""
				className="mx-auto mb-4 h-14 w-fit shrink-0 pettable rotate-10 desktop:mt-1 desktop:h-16"
				draggable={false}
				height={345}
				src={FlittyHardhat}
				width={412}
				onClick={() => setSquishCount((squishCount) => squishCount + 1)}
			/>
			<h1>{t2.title}</h1>
			{t2.subtitle && <h2 className="mb-2 text-sm desktop:text-base">{t2.subtitle}</h2>}
			<div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs desktop:text-sm">
				<span className="cursor-pointer text-theme-2" onClick={reload}>
					{t2.reload}
				</span>
				{urls.socials.discord && (
					<>
						{" ⋅ "}
						<a className="text-theme-2" href={urls.socials.discord}>
							{t2.discord}
						</a>
					</>
				)}
				{urls.resources.contact && (
					<>
						{" ⋅ "}
						<a className="text-theme-2" href={urls.resources.contact}>
							{t("contact_us")}
						</a>
					</>
				)}
			</div>
			{!maintenance && (
				<>
					<ul className="mt-6 ml-4 flex max-w-sm list-disc flex-col gap-2 text-sm desktop:max-w-md desktop:text-base">
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
						{native && (<li>{t("error_tip_restart_app")}</li>)}
						<li>
							<Trans
								components={{
									"browser-icon": <AppWindow className="mr-1 inline-block size-4 shrink-0" />,
									"device-icon": <Smartphone className="mr-0.5 inline-block size-4 shrink-0" />
								}}
								i18nKey={native ? "error_tip_update_app" : "error_tip_update_browser"}
							/>
						</li>
						<li>
							<Trans
								components={{
									icon: <WifiOff className="mr-1 inline-block size-4 shrink-0" />,
								}}
								i18nKey="error_tip_connection"
							/>
						</li>
						{urls.resources.contact && (
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
									i18nKey="error_tip_contact"
								/>
							</li>
						)}
					</ul>
					{(development || squishCount > 2) && error instanceof Error && (
						<code className="mt-6 flex max-w-sm flex-col font-mono text-xs opacity-50 select-children desktop:max-w-md desktop:text-sm">
							<span className="line-clamp-5 font-semibold">{error.message}</span>
							{error.stack && (
								<p
									className="mt-4 line-clamp-6 h-32 overflow-hidden whitespace-pre-wrap hover:line-clamp-none hover:overflow-y-scroll"
									onMouseLeave={({ currentTarget }) => currentTarget.scrollTop = 0}
								>
									{error.stack.replaceAll(/\n/g, "\n\n")}
								</p>
							)}
						</code>
					)}
					<div className="mt-6 flex flex-col text-center text-xs">
						{eventId && (
							<span className="font-mono opacity-50 desktop:text-sm">
								{eventId}
							</span>
						)}
						<span className="font-mono opacity-50 desktop:text-sm">
							{t("version", { version })}
						</span>
						<button
							className="mt-2 text-theme-2"
							type="button"
							onClick={async () => {
								const session = await getSession().catch(() => null);

								const extra = {
									production,
									development,
									preview: preview || undefined,
									user: session?.user.id,
									sudoer: session?.sudoerId,
									...device
								};

								await Clipboard.write({
									label: t("flirtual_bug_report"),
									string: `# ${brand.name} bug report

* At: <t:${Math.floor(Date.now() / 1000)}:F>
* Event ID: \`${eventId}\`
* URL: <${window.location.href}>
* Commit: [${commitId}](<${commitUrl}>)

\`\`\`
${`${(error && typeof error === "object" && "message" in error && error.message)}

${String((error && typeof error === "object" && "stack" in error && error.stack)).slice(0, 1024)}`.trim()}
\`\`\`

${Object.entries(extra)
					.filter(([, value]) => value)
					.map(([key, value]) => `* ${key}: \`\`${value}\`\``)
					.join("\n")}
`
								});

								setCopied(true);
							}}
						>
							{
								copied
									? (
											<>
												{t("copied")}
												{" "}
												<Check className="inline size-3" strokeWidth={3} />
											</>
										)
									: t("copy_details")
							}
						</button>
					</div>
				</>
			)}
		</div>
	);
}

export const HavingIssuesViewport: FC<ComponentProps<typeof HavingIssues>> = (props) => {
	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<HavingIssues {...props} />
		</div>
	);
};
