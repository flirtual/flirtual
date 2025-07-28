import { useCallback, useState } from "react";
import type { FC } from "react";
import { keys } from "remeda";

import { useInterval } from "~/hooks/use-interval";
import { useMessages } from "~/i18n";

export const ProfileMessage: FC = () => {
	const {
		motionless_absorbed_scintillating_rightful: messages
	} = useMessages();

	const [current, setCurrent] = useState(Object.keys(messages)[0] as keyof typeof messages);

	/*
	t("motionless_absorbed_scintillating_rightful.0")"
	t("motionless_absorbed_scintillating_rightful.1")"
	t("motionless_absorbed_scintillating_rightful.2")"
	*/

	useInterval(
		useCallback(() => {
			setCurrent((current) => {
				const messageKeys = keys(messages);
				const index = messageKeys.indexOf(current.toString());

				return messageKeys[(index + 1) % messageKeys.length]!;
			});
		}, [messages]),
		5000
	);

	return (
		<span className="h-[8ch] max-w-4xl text-balance font-nunito text-2xl font-normal leading-snug desktop:h-[5ch] desktop:text-4xl">
			{messages[current]}
		</span>
	);
};
