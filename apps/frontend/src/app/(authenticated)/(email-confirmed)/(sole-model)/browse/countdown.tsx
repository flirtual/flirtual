"use client";

import { useEffect, useState } from "react";

function useCountdown(date: string): string {
	const [timeRemaining, setTimeRemaining] = useState("⏳");

	useEffect(() => {
		const updateTimer = () => {
			const now = Date.now();
			const target = new Date(date).getTime();
			const distance = target - now;

			if (distance > 0) {
				const hours = Math.floor(distance / (1000 * 60 * 60));
				const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
				const seconds = Math.floor((distance % (1000 * 60)) / 1000);

				setTimeRemaining(
					`${hours.toString().padStart(2, "0")}:${minutes
						.toString()
						.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
				);
			} else {
				setTimeRemaining("00:00:00");
			}
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [date]);

	return timeRemaining;
}

interface CountdownProps {
	date: string;
}

export const Countdown: React.FC<CountdownProps> = ({ date }) => {
	const countdown = useCountdown(date);

	return <>{countdown}</>;
};
