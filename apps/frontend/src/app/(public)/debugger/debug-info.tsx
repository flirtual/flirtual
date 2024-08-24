"use client";

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
				<span className="font-montserrat text-lg font-bold">Device</span>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">App platform: </span>
					<span className="truncate font-mono text-sm">
						{platform}
						{platformModifiers.length > 0
							? ` (${platformModifiers.join(", ")})`
							: ""}
					</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">Browser: </span>
					<span className="truncate font-mono">{`${browser.name} ${browser.version} (${engine.name}${browser.version === engine.version ? "" : ` ${engine.version}`})`}</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">System: </span>
					<span className="truncate font-mono text-sm">
						{os.name} {os.version}
					</span>
				</div>
			</div>
			<div className="flex flex-col">
				<span className="font-montserrat text-lg font-bold">Session</span>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">User profile: </span>
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
							: "Unavailable"}
					</InlineLink>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">User object: </span>
					<InlineLink
						highlight={false}
						href={isDebugger ? api.newUrl(`users/${session.user.id}`) : null}
						className={twMerge(
							"truncate font-mono text-sm",
							!isDebugger && "text-inherit hocus:no-underline"
						)}
					>
						{session?.user.id ?? "Unavailable"}
					</InlineLink>
				</div>
				{session?.sudoerId && (
					<div className="flex justify-between gap-8 text-sm">
						<span className="shrink-0">Sudoer object: </span>
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
					<span className="shrink-0">Age: </span>
					<span className="font-mono">
						{session ? (
							<TimeRelative value={session.createdAt} />
						) : (
							"Unavailable"
						)}
					</span>
				</div>
			</div>
			<div className="flex flex-col">
				<span className="font-montserrat text-lg font-bold">Build</span>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">Environment: </span>
					<span className="truncate font-mono text-sm">
						{capitalize(environment)}
					</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">Version: </span>
					<span className="truncate font-mono text-sm">{gitCommitSha}</span>
				</div>
			</div>
		</>
	);
};
