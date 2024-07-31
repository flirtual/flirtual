const oneDayInMiliiseconds = 8.64e7;
const twoWeeksInMillieseconds = 1.21e9;

export interface ActivityIndicatorProps {
	lastActiveAt: Date;
}

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
	lastActiveAt
}) => {
	const timeSince = Date.now() - lastActiveAt.getTime();

	return timeSince < twoWeeksInMillieseconds ? (
		<div className="flex items-center gap-2">
			<div className="size-4 rounded-full bg-green-500" />
			<span className="text-shadow-brand select-none font-montserrat font-semibold">
				{timeSince < oneDayInMiliiseconds ? "Active today" : "Active recently"}
			</span>
		</div>
	) : null;
};
