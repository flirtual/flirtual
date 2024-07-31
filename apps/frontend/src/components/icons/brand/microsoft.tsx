import { forwardRef } from "react";

import type { IconComponentProps } from "..";

export const MicrosoftIcon = forwardRef<SVGSVGElement, IconComponentProps>(
	(props, reference) => (
		<svg
			{...props}
			fill="currentColor"
			ref={reference}
			role="img"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Microsoft</title>
			<path d="M0 0v11.408h11.408V0zm12.594 0v11.408H24V0zM0 12.594V24h11.408V12.594zm12.594 0V24H24V12.594z" />
		</svg>
	)
);
