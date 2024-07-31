import { forwardRef } from "react";

import type { IconComponentProps } from "..";

export const FaceTimeIcon = forwardRef<SVGSVGElement, IconComponentProps>(
	(props, reference) => (
		<svg
			{...props}
			fill="currentColor"
			ref={reference}
			role="img"
			viewBox="0 0 417.1 261.5"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>FaceTime</title>
			<path
				d="M0 57.7v146.1c0 31.9 25.9 57.7 57.7 57.7h175.8c31.9 0 57.7-25.9 57.7-57.7V57.7c0-31.9-25.9-57.7-57.7-57.7H57.8C25.9-.1 0 25.8 0 57.7m379.3-39.1-66.2 54.6c-5.9 4.9-9.3 12.1-9.3 19.7v75.6c0 7.6 3.3 14.7 9.1 19.6l66.2 55.6c15.1 12.6 38 1.9 38-17.7V36.4c.1-19.5-22.7-30.3-37.8-17.8"
				fill="#fff"
			/>
		</svg>
	)
);
