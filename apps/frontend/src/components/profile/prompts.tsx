import { useSuspenseQuery } from "@tanstack/react-query";
import type { FC } from "react";

import { byId, promptsOptions } from "~/api/data";
import type { ProfilePrompt } from "~/api/user/profile";
import { useLocale } from "~/i18n";

export const ProfilePrompts: FC<{
	prompts: Array<ProfilePrompt>;
}> = ({ prompts }) => {
	const [locale] = useLocale();
	const { data: promptsById } = useSuspenseQuery({ ...promptsOptions({ locale }), select: byId });
	if (!prompts || prompts.length === 0) return null;

	return (
		<div className="flex flex-col gap-4 vision:text-white-20">
			{prompts.map(({ response, prompt }) => (
				<div
					key={prompt}
					className="gap-2 rounded-xl bg-white-30 p-4 shadow-brand-1 dark:bg-black-60 vision:bg-white-30/70 vision:text-black-80"
				>
					<h2 className="text-base opacity-70">
						{promptsById[prompt]?.name || prompt}
					</h2>
					<p className="text-lg whitespace-pre-wrap select-children">
						{response}
					</p>
				</div>
			))}
		</div>
	);
};
