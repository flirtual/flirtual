"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useInterval } from "~/hooks/use-interval";

function timeTill(date: Date) {
	const now = Date.now();
	const target = date.getTime();
	const distance = target - now;

	if (distance <= 0) return { hours: 0, minutes: 0, seconds: 0 };

	const hours = Math.floor(distance / (1000 * 60 * 60));
	const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((distance % (1000 * 60)) / 1000);

	return { hours, minutes, seconds };
}

function useCountdown(date: string, onComplete: () => void) {
	const [value, setValue] = useState(() => timeTill(new Date(date)));

	const { clear } = useInterval(
		useCallback(() => {
			const value = timeTill(new Date(date));
			setValue(value);

			if (value.hours === 0 && value.minutes === 0 && value.seconds === 0) {
				onComplete();
				clear();
			}
		// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [date, onComplete]),
		500
	);

	return value;
}

interface CountdownProps {
	date: string;
	onComplete: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({ date, onComplete }) => {
	const { t } = useTranslation();
	const { hours, minutes, seconds } = useCountdown(date, onComplete);

	return (
		<div className="grid grid-cols-3 overflow-hidden rounded-xl text-black-80">
			<div className="flex w-full flex-col border-r-2 border-dashed border-black-80/10 bg-white-20 p-4">
				<span className="opacity-75">{t("hours")}</span>
				<span className="text-2xl tabular-nums">{hours}</span>
			</div>
			<div className="flex w-full flex-col border-r-2 border-dashed border-black-80/10 bg-white-20 p-4">
				<span className="opacity-75">{t("minutes")}</span>
				<span className="text-2xl tabular-nums">{minutes}</span>
			</div>
			<div className="flex w-full flex-col bg-white-20 p-4">
				<span className="opacity-75">{t("seconds")}</span>
				<span className="text-2xl tabular-nums">{seconds}</span>
			</div>
		</div>
	);
};
