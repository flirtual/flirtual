import { headers } from "next/headers";
// eslint-disable-next-line import/named
import { parse as parsePlatform } from "platform";

import { api } from "~/api";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { withOptionalSession } from "~/server-utilities";

export default async function DebuggerPage() {
	const session = await withOptionalSession();

	console.log(process.env);

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const userAgent = headers().get("user-agent")!;
	const { os, name, version, layout } = parsePlatform(userAgent);

	return (
		<div className="flex h-screen w-screen bg-brand-gradient sm:items-center sm:justify-center">
			<ModelCard className="h-full sm:h-fit" containerProps={{ className: "gap-4" }} title="Debug">
				<div className="flex flex-col">
					<span className="text-lg font-semibold">Browser</span>
					<span className="font-mono text-sm">{`${name} ${version} (${layout})`}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-lg font-semibold">Operating System</span>
					<span className="font-mono text-sm">{os?.toString()}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-lg font-semibold">User</span>
					<InlineLink
						className="font-mono text-sm"
						href={session ? api.newUrl(`users/${session.user.id}`) : null}
					>
						{session?.user.id ?? "None"}
					</InlineLink>
				</div>
			</ModelCard>
		</div>
	);
}
