import type { LucideProps } from "lucide-react";
import { Clock1, Clock2, Clock3, Clock4, Clock5, Clock6, Clock7, Clock8, Clock9, Clock10, Clock11, Clock12 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

export interface TimeDiffProps {
	diff: number;
	displayName: string;
}

const clockIcons: Array<React.FC<LucideProps> | null> = [
	null,
	Clock1,
	Clock2,
	Clock3,
	Clock4,
	Clock5,
	Clock6,
	Clock7,
	Clock8,
	Clock9,
	Clock10,
	Clock11,
	Clock12,
];

export const TimeDiff: React.FC<TimeDiffProps> = ({ diff, displayName }) => {
	const { t } = useTranslation();

	const sign = diff < 0 ? "-" : "+";
	const absDiff = Math.abs(diff);
	const hours = Math.floor(absDiff / 3600);
	const minutes = Math.floor((absDiff % 3600) / 60);
	const formattedDiff = `${sign}${hours}:${minutes.toString().padStart(2, "0")}`;

	const now = new Date();
	const theirTime = new Date(now.getTime() + diff * 1000);
	const formattedTime = theirTime.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "numeric"
	});

	const hourHand = theirTime.getHours() % 12 || 12;
	const ClockIcon = clockIcons[hourHand] || Clock4;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="pointer-events-auto flex items-center gap-2">
					<ClockIcon className="size-4" />
					<span className="text-shadow-brand font-montserrat font-semibold">
						{formattedDiff}
					</span>
				</div>
			</TooltipTrigger>
			<TooltipContent>{t("its_time_for_name", { time: formattedTime, name: displayName })}</TooltipContent>
		</Tooltip>
	);
};
