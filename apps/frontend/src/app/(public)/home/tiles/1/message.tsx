"use client";

import { useMessages } from "next-intl";
import { type FC, useCallback, useState } from "react";
import { keys } from "remeda";

import { useInterval } from "~/hooks/use-interval";

type ProfileMessageKey = keyof IntlMessages["landing"]["profiles"]["messages"];

export const ProfileMessage: FC = () => {
	const {
		landing: {
			profiles: { messages }
		}
	} = useMessages() as unknown as IntlMessages;

	const [current, setCurrent] = useState(
		Object.keys(messages)[0] as ProfileMessageKey
	);

	/*
	t("landing.profiles.messages.0")"
	t("landing.profiles.messages.1")"
	t("landing.profiles.messages.2")"
	*/

	useInterval(
		useCallback(() => {
			setCurrent((current) => {
				const messageKeys = keys(messages);
				return messageKeys[
					(messageKeys.indexOf(current) + 1) % messageKeys.length
				] as ProfileMessageKey;
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
