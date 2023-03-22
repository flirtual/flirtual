import { IconComponentProps } from ".";

export const HeartGradient: React.FC<IconComponentProps & { gradient?: boolean }> = ({
	gradient = true,
	...props
}) => (
	<svg
		enableBackground="new 0 0 512.001 512.001"
		fill={gradient ? "url(#aa)" : "currentColor"}
		version="1.1"
		viewBox="0 0 512 512"
		xmlns="http://www.w3.org/2000/svg"
		xmlnsXlink="http://www.w3.org/1999/xlink"
		{...props}
	>
		<defs>
			<linearGradient
				gradientUnits="userSpaceOnUse"
				id="aa"
				x1="90.392"
				x2="384.66"
				y1="167.59"
				y2="286.35"
			>
				<stop offset="0" stopColor="#ff8975" />
				<stop offset="1" stopColor="#e9658b" />
			</linearGradient>
		</defs>
		<path d="m256 477.41c-2.59 0-5.179-0.669-7.499-2.009-2.52-1.454-62.391-36.216-123.12-88.594-35.994-31.043-64.726-61.833-85.396-91.513-26.748-38.406-40.199-75.348-39.982-109.8 0.254-40.09 14.613-77.792 40.435-106.16 26.258-28.848 61.3-44.734 98.673-44.734 47.897 0 91.688 26.83 116.89 69.332 25.203-42.501 68.994-69.332 116.89-69.332 35.308 0 68.995 14.334 94.859 40.362 28.384 28.563 44.511 68.921 44.247 110.72-0.218 34.393-13.921 71.279-40.728 109.63-20.734 29.665-49.426 60.441-85.279 91.475-60.508 52.373-119.95 87.134-122.45 88.588-2.331 1.354-4.937 2.032-7.541 2.032z" />
	</svg>
);
