import { useTranslation } from "react-i18next";

export interface ActivityIndicatorProps {
	lastActiveAt: Date;
}

const oneDayInMilliseconds = 8.64e7;
const twoWeeksInMilliseconds = 1.21e9;

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
	lastActiveAt
}) => {
	const { t } = useTranslation();

	const timeSince = Date.now() - lastActiveAt.getTime();
	if (timeSince > twoWeeksInMilliseconds) return null;

	return (
		<div className="flex items-center gap-2">
			<div className="size-4 rounded-full bg-green-500" />
			<span className="text-shadow-brand font-montserrat font-semibold">
				{timeSince < oneDayInMilliseconds
					? t("active_today")
					: t("active_recently")}
			</span>
		</div>
	);
};
