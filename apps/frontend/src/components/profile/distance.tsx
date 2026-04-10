import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";

export interface DistanceProps {
	distance: string;
}

function parseDistance(distance: string): { within: boolean; value: number; unit: "km" | "mi" } | null {
	const within = distance.startsWith("<");
	const match = distance.match(/(\d+)(km|mi)/);
	if (!match) return null;
	return { within, value: Number(match[1]), unit: match[2] as "km" | "mi" };
}

export const Distance: React.FC<DistanceProps> = ({ distance }) => {
	const { t } = useTranslation();
	const parsed = parseDistance(distance);

	const tooltip = parsed
		? parsed.within
			? t(parsed.unit === "km" ? "distance_within_km" : "distance_within_mi", { distance: parsed.value })
			: t(parsed.unit === "km" ? "distance_around_km" : "distance_around_mi", { distance: parsed.value })
		: distance;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="pointer-events-auto flex items-center gap-2">
					<MapPin className="size-4" />
					<span className="text-shadow-brand font-montserrat font-semibold">
						{distance}
					</span>
				</div>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
};
