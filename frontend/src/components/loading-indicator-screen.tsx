import { useId } from "react";

import { IconComponentProps } from "./icons";

export const LoadingIndicator: React.FC<IconComponentProps> = (props) => {
	const id = useId();

	return (
		<svg {...props} viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient id={id} x1="8.042%" x2="65.682%" y1="0%" y2="23.865%">
					<stop offset="0%" stopColor="#fff" stopOpacity="0" />
					<stop offset="63.146%" stopColor="#fff" stopOpacity=".631" />
					<stop offset="100%" stopColor="#fff" />
				</linearGradient>
			</defs>
			<g fill="none" fillRule="evenodd">
				<g transform="translate(1 1)">
					<path d="M36 18c0-9.94-8.06-18-18-18" id="Oval-2" stroke={`url(#${id})`} strokeWidth="2">
						<animateTransform
							attributeName="transform"
							dur="0.9s"
							from="0 18 18"
							repeatCount="indefinite"
							to="360 18 18"
							type="rotate"
						/>
					</path>
					<circle cx="36" cy="18" fill="#fff" r="1">
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
	<div className="fixed top-0 left-0 z-40 flex h-full w-full items-center justify-center bg-black-90/60 p-4 backdrop-blur-sm md:p-16">
		<LoadingIndicator className="w-16 grow-0 text-white-10" />
	</div>
);
