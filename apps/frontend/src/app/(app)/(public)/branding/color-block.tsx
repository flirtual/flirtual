import { twMerge } from "tailwind-merge";

export interface ColorBlockProps {
	name: string;
	value: string;
	invert?: boolean;
}

export const ColorBlock: React.FC<ColorBlockProps> = ({
	name,
	value,
	invert
}) => (
	<div
		className={twMerge("grow rounded-lg p-4", invert && "text-black-80")}
		style={{ background: value }}
	>
		<span className="text-lg font-semibold">{name}</span>
		<pre className="[white-space:break-spaces]">{value}</pre>
	</div>
);
