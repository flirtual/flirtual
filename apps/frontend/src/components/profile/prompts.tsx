import type { FC } from "react";
import type { ProfilePrompt } from "~/api/user/profile/prompts";

export const ProfilePrompts: FC<{
	prompts: Array<ProfilePrompt>;
}> = ({ prompts }) => {
	if (!prompts || prompts.length === 0) return null;

	return (
		<div className="flex flex-col gap-4 vision:text-white-20">
			{prompts.map(({ prompt, response }) => (
				<div
					key={prompt.id}
					className="gap-2 rounded-xl bg-white-30 p-4 shadow-brand-1 vision:bg-white-30/70 vision:text-black-80 dark:bg-black-60"
				>
					<h2 className="select-none text-base opacity-70">{prompt.name}</h2>
					<p className="whitespace-pre-wrap text-lg">{response}</p>
				</div>
			))}
		</div>
	);
};
