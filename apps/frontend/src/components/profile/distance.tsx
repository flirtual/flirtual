import { MapPin } from "lucide-react";

export interface DistanceProps {
	distance: string;
}

export const Distance: React.FC<DistanceProps> = ({ distance }) => {
	return (
		<div className="pointer-events-auto flex items-center gap-2">
			<MapPin className="size-4" />
			<span className="text-shadow-brand font-montserrat font-semibold">
				{distance}
			</span>
		</div>
	);
};
