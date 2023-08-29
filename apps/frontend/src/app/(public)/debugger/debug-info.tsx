"use client";

import { parse as parsePlatform } from "platform";
import { twMerge } from "tailwind-merge";

import { api } from "~/api";
import { displayName } from "~/api/user";
import { InlineLink } from "~/components/inline-link";
import { TimeRelative } from "~/components/time-relative";
import { environment, gitCommitSha } from "~/const";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import { capitalize } from "~/utilities";

export const DebugInfo: React.FC = () => {
	const [session] = useSession();
	const isDebugger =
		session && (session.user.tags?.includes("debugger") || session.sudoerId);

	const userAgent =
		typeof window === "undefined" ? "" : window.navigator.userAgent;
	const { os, name, version, layout } = parsePlatform(userAgent);

	return (
		<>
			<div className="flex flex-col">
				<span className="font-montserrat text-lg font-bold">Agent</span>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">Browser: </span>
					<span className="truncate font-mono">{`${name} ${version} (${layout})`}</span>
				</div>
				<div className="flex justify-between gap-8 text-sm">
					<span className="shrink-0">System: </span>
					<span className="truncate font-mono text-sm">{os?.toString()}</span>
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
							? `${displayName(session.user)} (${session.user.username})`
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
