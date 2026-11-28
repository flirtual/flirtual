import { ImagePlay, SendHorizontal, Smile } from "lucide-react";
import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import { klipyAppKey } from "~/const";
import { usePreferences } from "~/hooks/use-preferences";

import { composerPadding, iconButton, input, inputHeight, lineHeight } from "./composer-styles";

export const ComposerSkeleton: FC = () => (
	<div aria-hidden inert className={composerPadding}>
		<div className="flex w-full items-center gap-1">
			<div className="relative w-full grow">
				<div className={twMerge(input, inputHeight)} />
				<div className="absolute inset-y-0 right-2 flex items-center">
					{klipyAppKey && <span className={iconButton}><ImagePlay /></span>}
					<span className={iconButton}><Smile /></span>
				</div>
			</div>
			<span className={twMerge(iconButton, "opacity-60")}><SendHorizontal className="fill-current" /></span>
		</div>
	</div>
);

export const ChatSkeleton: FC = () => {
	const [fontSize] = usePreferences<number>("font_size", 16);

	return (
		<div className="flex size-full flex-col justify-end" style={{ fontSize, lineHeight }}>
			<ComposerSkeleton />
		</div>
	);
};
