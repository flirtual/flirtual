"use client";

import { useMessages } from "next-intl";
import { type FC, useCallback, useState } from "react";

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

	useInterval(
		useCallback(() => {
			setCurrent((current) => {
				const keys = Object.keys(messages);
				return keys[
					(keys.indexOf(current) + 1) % keys.length
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
