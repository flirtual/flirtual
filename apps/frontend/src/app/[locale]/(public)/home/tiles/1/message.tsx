import ms from "ms" with { type: "macro" };
import { useCallback, useState } from "react";
import type { FC } from "react";
import { keys } from "remeda";

import { useInterval } from "~/hooks/use-interval";
import { useMessages } from "~/i18n";

export const ProfileMessage: FC = () => {
	const {
		landing_avatar_points: messages
	} = useMessages();

	const [current, setCurrent] = useState(Object.keys(messages)[0] as keyof typeof messages);

	/*
	t("landing_avatar_points.0")"
	t("landing_avatar_points.1")"
	t("landing_avatar_points.2")"
	*/

	useInterval(
		useCallback(() => {
			setCurrent((current) => {
				const messageKeys = keys(messages);
				const index = messageKeys.indexOf(current.toString());

				return messageKeys[(index + 1) % messageKeys.length]!;
			});
		}, [messages]),
		ms("5s")
	);

	return (
		<span className="h-[8ch] max-w-4xl font-nunito text-2xl leading-snug font-normal text-balance desktop:h-[5ch] desktop:text-4xl">
			{messages[current]}
		</span>
	);
};
