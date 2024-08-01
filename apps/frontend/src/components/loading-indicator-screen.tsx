import { useId } from "react";

import { IconComponentProps } from "./icons";

export const LoadingIndicator: React.FC<IconComponentProps> = (props) => {
	const id = useId();

	return (
		<svg {...props} viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient id={id} x1="8.042%" x2="65.682%" y1="0%" y2="23.865%">
					<stop offset="0%" stopColor="#e9658b" stopOpacity="0" />
					<stop offset="63.146%" stopColor="#e9658b" stopOpacity=".631" />
					<stop offset="100%" stopColor="#e9658b" />
				</linearGradient>
			</defs>
			<g fill="none" fillRule="evenodd">
				<g transform="translate(1 1)">
					<path
						d="M36 18c0-9.94-8.06-18-18-18"
						id="Oval-2"
						stroke={`url(#${id})`}
						strokeWidth="2"
					>
						<animateTransform
							attributeName="transform"
							dur="0.9s"
							from="0 18 18"
							repeatCount="indefinite"
							to="360 18 18"
							type="rotate"
						/>
					</path>
					<circle cx="36" cy="18" fill="#e9658b" r="1">
						<animateTransform
							attributeName="transform"
							dur="0.9s"
							from="0 18 18"
							repeatCount="indefinite"
							to="360 18 18"
							type="rotate"
						/>
					</circle>
				</g>
			</g>
		</svg>
	);
};

export const LoadingIndicatorScreen: React.FC = () => (
	<div className="fixed left-0 top-0 z-40 flex h-full w-full items-center justify-center bg-cream p-4 dark:bg-black-80 md:p-16">
		<LoadingIndicator className="w-16 grow-0 text-theme-2" />
	</div>
);