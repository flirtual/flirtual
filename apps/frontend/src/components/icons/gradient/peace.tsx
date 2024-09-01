import { useId, type CSSProperties } from "react";

import type { GradientIconProps } from ".";

export const PeaceIcon: React.FC<GradientIconProps> = ({
	gradient = true,
	...props
}) => {
	const id = useId();

	return (
		<svg
			style={{ "--fill": `url(#${id})` } as CSSProperties}
			enableBackground="new 0 0 236.245 236.245"
			fill={gradient ? `var(--fill)` : "currentColor"}
			version="1.1"
			viewBox="0 0 236.24 236.24"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			xmlSpace="preserve"
			{...props}
		>
			{gradient && (
				<defs>
					<linearGradient
						gradientUnits="userSpaceOnUse"
						id={id}
						x1="56.676"
						x2="172.74"
						y1="97.05"
						y2="151.36"
					>
						<stop offset="0" style={{ stopColor: "var(--friend-theme-1)" }} />
						<stop offset="1" style={{ stopColor: "var(--friend-theme-2)" }} />
					</linearGradient>
				</defs>
			)}
			<path d="m194.84 135.85c-2.133-22.22-15.158-25.655-21.474-25.995-2.108-0.113-3.979-1.308-5.003-3.153-5.237-9.439-13.203-11.707-19.649-11.707-0.829 0-1.634 0.038-2.404 0.102-0.169 0.014-0.337 0.021-0.502 0.021-3.804 0-6.652-3.66-5.688-7.434 5.181-20.277 18.426-66.731 18.426-66.731 4.125-12.355-5.957-20.949-15.828-20.95-6.135 0-12.189 3.319-14.701 11.119l-18.587 61.864c-1.253 4.17-4.841 6.267-8.43 6.267-3.528 0-7.057-2.026-8.37-6.1l-17.753-55.086c-2.114-8.786-8.794-12.64-15.552-12.64-9.626 0-19.412 7.816-16.398 20.332l19.132 79.563c0.764 3.175-1.168 6.354-4.329 7.171-6.207 1.604-15.255 6.709-16.433 22.781-1.439 19.636 27.503 57.831 33.032 65.885 0.594 0.865 0.948 1.868 1.029 2.915l2.936 26.793c0.24 3.105 2.83 5.381 5.945 5.381h72.49c3.139 0 5.74-2.311 5.95-5.443l2.37-24.415c0.071-1.064 0.422-2.054 1.025-2.934 5.251-7.663 31.222-42.014 28.766-67.606z" />
		</svg>
	);
};
