import { twMerge } from "tailwind-merge";

const ONE_DAY_IN_MILLISECONDS = 8.64e7;
const TWO_WEEKS_IN_MILLISECONDS = 1.21e9;

export interface ActivityIndicatorProps {
	lastActiveAt: Date;
}

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({ lastActiveAt }) => {
	const timeSince = Date.now() - lastActiveAt.getTime();

	const color =
		timeSince < TWO_WEEKS_IN_MILLISECONDS
			? timeSince < ONE_DAY_IN_MILLISECONDS
				? "bg-green-500"
				: "bg-yellow-500"
			: "bg-black-70";
	const text =
		timeSince < TWO_WEEKS_IN_MILLISECONDS
			? timeSince < ONE_DAY_IN_MILLISECONDS
				? "Active today"
				: "Active recently"
			: "Offline";

	if (text.includes("Offline")) return null;

	return (
		<div className="flex items-center gap-2">
			<div className={twMerge("h-4 w-4 rounded-full", color)}>
				<div className={twMerge("h-4 w-4 animate-ping rounded-full", color)} />
			</div>
			<span className="select-none font-montserrat font-semibold">{text}</span>
		</div>
	);
};
