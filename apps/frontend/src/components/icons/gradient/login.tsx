import { useId } from "react";

import { GradientIconProps } from ".";

export const LoginIcon: React.FC<GradientIconProps> = ({
	gradient = true,
	...props
}) => {
	const id = useId();

	return (
		<svg
			enableBackground="new 0 0 512.022 512.022"
			fill={gradient ? `url(#${id})` : "currentColor"}
			version="1.1"
			viewBox="0 0 512.02 512.02"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			{gradient && (
				<defs>
					<linearGradient
						gradientUnits="userSpaceOnUse"
						id={id}
						x1="77.221"
						x2="435.48"
						y1="201.83"
						y2="319.67"
					>
						<stop offset="0" style={{ stopColor: "var(--theme-1)" }} />
						<stop offset="1" style={{ stopColor: "var(--theme-2)" }} />
					</linearGradient>
				</defs>
			)}
			<g>
				<path d="m80.04 346.01v-45h-65.029c-8.284 0-15-6.716-15-15v-60c0-8.284 6.716-15 15-15h65.029v-45c0-12.332 14.122-19.41 24-12l120 90c7.988 5.991 8 17.999 0 24l-120 90c-9.804 7.353-24 0.422-24-12z" />
				<path d="m155.011 90.012c-8.28 0-15 6.72-15 15l.029 38.5 102 76.5c11.173 8.38 17.673 22.045 17.971 36-.298 13.955-6.799 27.62-17.971 36l-102 76.5-.029 68.5c0 8.28 6.72 15 15 15h116v-362z" />
				<path d="m503.69 91.582-181-90c-9.952-4.944-21.68 2.296-21.68 13.43v482c0 10.287 10.086 17.437 19.72 14.24l181-60c6.14-2.04 10.28-7.77 10.28-14.24v-332c0-5.69-3.22-10.9-8.32-13.43zm-112.68 194.43c0 8.28-6.72 15-15 15s-15-6.72-15-15v-60c0-8.28 6.72-15 15-15s15 6.72 15 15z" />
			</g>
		</svg>
	);
};
