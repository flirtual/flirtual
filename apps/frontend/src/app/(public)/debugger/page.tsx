import { headers } from "next/headers";
// eslint-disable-next-line import/named
import { parse as parsePlatform } from "platform";

import { api } from "~/api";
import { displayName } from "~/api/user";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { TimeRelative } from "~/components/time-relative";
import { environment } from "~/const";
import { gitCommitSha, gitCommitUrl } from "~/const-server";
import { withOptionalSession } from "~/server-utilities";
import { urls } from "~/urls";
import { capitalize } from "~/utilities";

export default async function DebuggerPage() {
	const session = await withOptionalSession().catch(() => null);

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const userAgent = headers().get("user-agent")!;
	const { os, name, version, layout } = parsePlatform(userAgent);

	return (
		<div className="flex h-screen w-screen bg-cream font-nunito dark:bg-black-80 sm:items-center sm:justify-center">
			<ModelCard
				className="h-full sm:h-fit"
				containerProps={{ className: "gap-4" }}
				title="Debug"
			>
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
							className="truncate font-mono text-sm"
							href={session ? urls.user.profile(session.user.username) : null}
						>
							{session
								? `${displayName(session.user)} (${session.user.username})`
								: "Unavailable"}
						</InlineLink>
					</div>
					<div className="flex justify-between gap-8 text-sm">
						<span className="shrink-0">User object: </span>
						<InlineLink
							className="truncate font-mono text-sm"
							href={session ? api.newUrl(`users/${session.user.id}`) : null}
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
						<span className="shrink-0">Commit: </span>
						<InlineLink
							className="truncate font-mono text-sm"
							href={gitCommitUrl}
						>
							{gitCommitSha ? gitCommitSha.slice(0, 8) : "Unavailable"}
						</InlineLink>
					</div>
				</div>
			</ModelCard>
		</div>
	);
}
