import type { Endpoints } from "@octokit/types";
import { BugPlay } from "lucide-react";
import { unstable_cache } from "next/cache";
import { capitalize } from "remeda";

import { InlineLink } from "~/components/inline-link";
import { environment, gitCommitSha, gitCommitUrl, gitOrganization, gitRepository } from "~/const";

import { Banner } from "./(app)/banner";

const compare = unstable_cache(async () => {
	const response = await fetch(`https://api.github.com/repos/${gitOrganization}/${gitRepository}/compare/production...${gitCommitSha}`);
	return (await response.json()) as Endpoints["GET /repos/{owner}/{repo}/compare/{base}...{head}"]["response"]["data"];
}, [], { revalidate: 30 });

export async function StagingBanner() {
	const { ahead_by, behind_by } = await compare();

	return (
		<Banner className="bg-black-90 dark:bg-white-10 dark:text-black-80" icon={<BugPlay className="animate-none" />}>
			<div className="flex flex-wrap gap-x-4 gap-y-2">
				<span className="font-bold">
					{capitalize(environment)}
				</span>
				<span>
					<InlineLink
						highlight={false}
						href={gitCommitUrl}
					>
						{gitCommitSha.slice(0, 8)}
					</InlineLink>
					{(ahead_by > 0 || behind_by > 0) && (
						<>
							,
							{" "}
							<InlineLink
								highlight={false}
								href={`https://github.com/${gitOrganization}/${gitRepository}/compare/production...${gitCommitSha}`}
							>
								{behind_by > 0 && (
									<>
										{" "}
										{behind_by}
										{" "}
										commit(s) behind
									</>
								)}
								{ahead_by > 0 && (
									<>
										{behind_by > 0 && " and"}
										{" "}
										{ahead_by}
										{" "}
										commit(s) ahead of
									</>
								)}
								{" "}
								production
							</InlineLink>
						</>
					)}
				</span>
			</div>
		</Banner>
	);
};
