import { useId } from "react";

import type { GradientIconProps } from ".";

export const HomeIcon: React.FC<GradientIconProps> = ({
	gradient = true,
	...props
}) => {
	const id = useId();

	return (
		<svg
			fill={gradient ? `url(#${id})` : "currentColor"}
			version="1.1"
			viewBox="0 0 512 512"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			{gradient && (
				<defs>
					<linearGradient
						gradientTransform="matrix(.95678 0 0 .95678 -2.2726e-5 0)"
						gradientUnits="userSpaceOnUse"
						id={id}
						x1="63.923"
						x2="444.34"
						y1="201.91"
						y2="303.94"
					>
						<stop offset="0" style={{ stopColor: "var(--theme-1)" }} />
						<stop offset="1" style={{ stopColor: "var(--theme-2)" }} />
					</linearGradient>
				</defs>
			)}
			<path
				d="m476.66 213.07-199.86-199.85c-8.5176-8.5213-19.842-13.216-31.888-13.216s-23.37 4.6905-31.891 13.212l-199.72 199.72c-0.06728 0.0673-0.13455 0.13828-0.20182 0.20556-17.491 17.592-17.461 46.135 0.08596 63.682 8.0168 8.0205 18.605 12.666 29.925 13.152 0.4597 0.0448 0.92314 0.0672 1.3903 0.0672h7.9644v147.06c0 29.1 23.677 52.776 52.784 52.776h78.179c7.9233 0 14.352-6.4246 14.352-14.352v-115.29c0-13.279 10.801-24.08 24.08-24.08h46.112c13.279 0 24.08 10.801 24.08 24.08v115.29c0 7.9271 6.4246 14.352 14.352 14.352h78.179c29.107 0 52.784-23.677 52.784-52.776v-147.06h7.3851c12.042 0 23.366-4.6904 31.891-13.212 17.566-17.577 17.573-46.168 0.0224-63.757z"
				strokeWidth=".95678"
			/>
		</svg>
	);
};
