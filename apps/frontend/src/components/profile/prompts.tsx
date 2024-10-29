import { useAttributeTranslation } from "~/hooks/use-attribute";

import type { FC } from "react";
import type { ProfilePrompt } from "~/api/user/profile";

export const ProfilePrompts: FC<{
	prompts: Array<ProfilePrompt>;
}> = ({ prompts }) => {
	if (!prompts || prompts.length === 0) return null;
	const tAttribute = useAttributeTranslation();

	return (
		<div className="flex flex-col gap-4 vision:text-white-20">
			{prompts.map(({ response, promptId }) => (
				<div
					className="gap-2 rounded-xl bg-white-30 p-4 shadow-brand-1 vision:bg-white-30/70 vision:text-black-80 dark:bg-black-60"
					key={promptId}
				>
					<h2 className="text-base opacity-70">
						{tAttribute[promptId]?.name || promptId}
					</h2>
					<p className="select-children whitespace-pre-wrap text-lg">
						{response}
					</p>
				</div>
			))}
		</div>
	);
};
