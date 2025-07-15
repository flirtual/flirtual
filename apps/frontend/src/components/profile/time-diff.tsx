import type { LucideProps } from "lucide-react";
import { Clock1, Clock2, Clock3, Clock4, Clock5, Clock6, Clock7, Clock8, Clock9, Clock10, Clock11, Clock12 } from "lucide-react";
import { useFormatter } from "next-intl";

import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

export interface TimeDiffProps {
	diff: number;
	timezone: string;
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

export const TimeDiff: React.FC<TimeDiffProps> = ({ diff, timezone, displayName }) => {
	const formatter = useFormatter();
	const { t } = useTranslation();

	const sign = diff < 0 ? "-" : "+";
	const absDiff = Math.abs(diff);
	const hours = Math.floor(absDiff / 3600);
	const minutes = Math.floor((absDiff % 3600) / 60);
	const formattedDiff = `${sign}${hours}:${minutes.toString().padStart(2, "0")}`;

	const formattedTime = formatter.dateTime(new Date(), {
		timeZone: timezone,
		hour: "numeric",
		minute: "numeric"
	});

	const hourHand = Number.parseInt(
		new Date().toLocaleString("en-US", {
			timeZone: timezone,
			hour: "numeric"
		}),
		10
	);

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
			<TooltipContent>{t("its_currently_time_for_name", { time: formattedTime, name: displayName })}</TooltipContent>
		</Tooltip>
	);
};
