"use client";

import { useMessages } from "next-intl";
import { useCallback, useState, type FC } from "react";

import { useInterval } from "~/hooks/use-interval";

export const ProfileMessage: FC = () => {
	const {
		landing: {
			profiles: { messages }
		}
	} = useMessages() as unknown as {
		landing: {
			profiles: {
				messages: Record<string, string>;
			};
		};
	};

	const [activeIndex, setActiveIndex] = useState(0);

	useInterval(
		useCallback(() => {
			setActiveIndex(
				(activeIndex) => (activeIndex + 1) % Object.keys(messages).length
			);
		}, [messages.length]),
		5000
	);

	const activeValue = messages[activeIndex];

	return (
		<span className="h-[8ch] max-w-4xl text-balance font-nunito text-[3vh] font-normal leading-snug desktop:h-[5ch] desktop:text-[5vh]">
			{activeValue}
		</span>
	);
};
