"use client";

import { useTranslations } from "next-intl";
import { capitalize } from "remeda";
import { twMerge } from "tailwind-merge";

import { api } from "~/api/common";
import { displayName } from "~/api/user";
import { InlineLink } from "~/components/inline-link";
import { TimeRelative } from "~/components/time-relative";
import { environment, gitCommitSha } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { useInternationalization } from "~/hooks/use-internationalization";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

export const DebugInfo: React.FC = () => {
	const t = useTranslations();

	const {
		platform,
		native,
		vision,
		userAgent: { browser, engine, os }
	} = useDevice();

	const { locale } = useInternationalization();

	const languageNames = new Intl.DisplayNames(locale.current, {
		type: "language"
	});

	const [session] = useSession();
	const isDebugger
		= session && (session.user.tags?.includes("debugger") || session.sudoerId);

	const platformModifiers = Object.entries({ native, vision })
		.filter(([, value]) => value)
		.map(([key]) => key);

	return (
		<>
			<div className="select-children flex flex-col">
				<span className="text-lg font-bold">{t("device")}</span>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">
						{t("lucky_sound_opossum_absorb")}
						{" "}
					</span>
					<span className="truncate font-mono text-sm">
						{platform}
						{platformModifiers.length > 0
							? ` (${platformModifiers.join(", ")})`
							: ""}
					</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">
						{t("vexed_yummy_tadpole_grow")}
						{" "}
					</span>
					<span className="truncate font-mono">{`${browser.name} ${browser.version} (${engine.name}${browser.version === engine.version ? "" : ` ${engine.version}`})`}</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">
						{t("known_spare_mantis_pet")}
						{" "}
					</span>
					<span className="truncate font-mono text-sm">
						{os.name}
						{" "}
						{os.version}
					</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">
						{t("hour_odd_kudu_dine")}
						{" "}
					</span>
					<span className="truncate font-mono text-sm">
						{languageNames.of(locale.current)}
						{" "}
						(
						{locale.current}
						)
					</span>
				</div>
			</div>
			<div className="select-children flex flex-col">
				<span className="text-lg font-bold">
					{t("session")}
				</span>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">
						{t("wacky_spry_haddock_jump")}
						{" "}
					</span>
					<InlineLink
						className={twMerge(
							"truncate font-mono text-sm",
							!isDebugger && "text-inherit hocus:no-underline"
						)}
						highlight={false}
						href={isDebugger ? urls.profile(session.user) : null}
					>
						{session
							? `${displayName(session.user)} (${session.user.slug})`
							: t("brief_neat_kestrel_ascend")}
					</InlineLink>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">
						{t("spry_polite_elk_grace")}
						{" "}
					</span>
					<InlineLink
						className={twMerge(
							"truncate font-mono text-sm",
							!isDebugger && "text-inherit hocus:no-underline"
						)}
						highlight={false}
						href={isDebugger ? api.url(`/users/${session.user.id}`)._url : null}
					>
						{session?.user.id ?? t("brief_neat_kestrel_ascend")}
					</InlineLink>
				</div>
				{session?.sudoerId && (
					<div className="flex justify-between gap-8 text-sm">
						<span className="shrink-0">
							{t("flat_civil_goat_absorb")}
							{" "}
						</span>
						<InlineLink
							className="truncate font-mono text-sm"
							highlight={false}
							href={api.url(`/users/${session.sudoerId}`)._url}
						>
							{session?.user.id}
						</InlineLink>
					</div>
				)}
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">
						{t("north_crisp_fly_dart")}
						{" "}
					</span>
					<span className="font-mono">
						{session
							? (
									<TimeRelative value={session.createdAt} />
								)
							: (
									t("brief_neat_kestrel_ascend")
								)}
					</span>
				</div>
			</div>
			<div className="select-children flex flex-col">
				<span className="text-lg font-bold">{t("dark_wild_mouse_roar")}</span>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">
						{t("swift_short_koala_fond")}
						{" "}
					</span>
					<span className="truncate font-mono text-sm">
						{capitalize(environment)}
					</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">
						{t("each_zippy_millipede_pop")}
						{" "}
					</span>
					<span className="truncate font-mono text-sm">{gitCommitSha}</span>
				</div>
			</div>
		</>
	);
};
