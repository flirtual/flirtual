"use client";

import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { api } from "~/api";
import { displayName } from "~/api/user";
import { InlineLink } from "~/components/inline-link";
import { TimeRelative } from "~/components/time-relative";
import { environment, gitCommitSha } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import { capitalize } from "~/utilities";

export const DebugInfo: React.FC = () => {
	const t = useTranslations("debugger");

	const {
		platform,
		native,
		vision,
		userAgent: { browser, engine, os }
	} = useDevice();
	const [session] = useSession();
	const isDebugger =
		session && (session.user.tags?.includes("debugger") || session.sudoerId);

	const platformModifiers = Object.entries({ native, vision })
		.filter(([, value]) => value)
		.map(([key]) => key);

	return (
		<>
			<div className="flex flex-col">
				<span className="font-montserrat text-lg font-bold">
					{t("spicy_pretty_tiger_pet")}
				</span>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">{t("lucky_sound_opossum_absorb")} </span>
					<span className="truncate font-mono text-sm">
						{platform}
						{platformModifiers.length > 0
							? ` (${platformModifiers.join(", ")})`
							: ""}
					</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">{t("vexed_yummy_tadpole_grow")} </span>
					<span className="truncate font-mono">{`${browser.name} ${browser.version} (${engine.name}${browser.version === engine.version ? "" : ` ${engine.version}`})`}</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">{t("known_spare_mantis_pet")} </span>
					<span className="truncate font-mono text-sm">
						{os.name} {os.version}
					</span>
				</div>
			</div>
			<div className="flex flex-col">
				<span className="font-montserrat text-lg font-bold">
					{t("mushy_muddy_warthog_win")}
				</span>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">{t("wacky_spry_haddock_jump")} </span>
					<InlineLink
						highlight={false}
						href={isDebugger ? urls.profile(session.user) : null}
						className={twMerge(
							"truncate font-mono text-sm",
							!isDebugger && "text-inherit hocus:no-underline"
						)}
					>
						{session
							? `${displayName(session.user)} (${session.user.slug})`
							: t("brief_neat_kestrel_ascend")}
					</InlineLink>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">{t("spry_polite_elk_grace")} </span>
					<InlineLink
						highlight={false}
						href={isDebugger ? api.newUrl(`users/${session.user.id}`) : null}
						className={twMerge(
							"truncate font-mono text-sm",
							!isDebugger && "text-inherit hocus:no-underline"
						)}
					>
						{session?.user.id ?? t("brief_neat_kestrel_ascend")}
					</InlineLink>
				</div>
				{session?.sudoerId && (
					<div className="flex justify-between gap-8 text-sm">
						<span className="shrink-0">{t("flat_civil_goat_absorb")} </span>
						<InlineLink
							className="truncate font-mono text-sm"
							highlight={false}
							href={api.newUrl(`users/${session.sudoerId}`)}
						>
							{session?.user.id}
						</InlineLink>
					</div>
				)}
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">{t("north_crisp_fly_dart")} </span>
					<span className="font-mono">
						{session ? (
							<TimeRelative value={session.createdAt} />
						) : (
							t("brief_neat_kestrel_ascend")
						)}
					</span>
				</div>
			</div>
			<div className="flex flex-col">
				<span className="font-montserrat text-lg font-bold">
					{t("dark_wild_mouse_roar")}
				</span>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">{t("swift_short_koala_fond")} </span>
					<span className="truncate font-mono text-sm">
						{capitalize(environment)}
					</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">{t("each_zippy_millipede_pop")} </span>
					<span className="truncate font-mono text-sm">{gitCommitSha}</span>
				</div>
			</div>
		</>
	);
};
