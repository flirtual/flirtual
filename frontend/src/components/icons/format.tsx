import { IconComponent } from ".";

export const FormatBoldIcon: IconComponent = (props) => (
	<svg strokeWidth={2} {...props} fill="none" stroke="currentColor" viewBox="0 0 18 18">
		<path d="M5,4H9.5A2.5,2.5,0,0,1,12,6.5v0A2.5,2.5,0,0,1,9.5,9H5A0,0,0,0,1,5,9V4A0,0,0,0,1,5,4Z" />
		<path d="M5,9h5.5A2.5,2.5,0,0,1,13,11.5v0A2.5,2.5,0,0,1,10.5,14H5a0,0,0,0,1,0,0V9A0,0,0,0,1,5,9Z" />
	</svg>
);

export const FormatItalicIcon: IconComponent = (props) => (
	<svg strokeWidth={2} {...props} fill="none" stroke="currentColor" viewBox="0 0 18 18">
		<line x1="7" x2="13" y1="4" y2="4" />
		<line x1="5" x2="11" y1="14" y2="14" />
		<line x1="8" x2="10" y1="14" y2="4" />
	</svg>
);

export const FormatUnderlineIcon: IconComponent = (props) => (
	<svg strokeWidth={2} {...props} viewBox="0 0 18 18">
		<path
			d="M5,3V9a4.012,4.012,0,0,0,4,4H9a4.012,4.012,0,0,0,4-4V3"
			fill="none"
			stroke="currentColor"
		/>
		<rect fill="currentColor" height="1" rx="0.5" ry="0.5" width="12" x="3" y="15" />
	</svg>
);

export const FormatStrikethroughIcon: IconComponent = (props) => (
	<svg strokeWidth={2} {...props} fill="currentColor" viewBox="0 0 18 18">
		<line className="ql-stroke ql-thin" x1="15.5" x2="2.5" y1="8.5" y2="9.5" />
		<path d="M9.007,8C6.542,7.791,6,7.519,6,6.5,6,5.792,7.283,5,9,5c1.571,0,2.765.679,2.969,1.309a1,1,0,0,0,1.9-.617C13.356,4.106,11.354,3,9,3,6.2,3,4,4.538,4,6.5a3.2,3.2,0,0,0,.5,1.843Z" />
		<path d="M8.984,10C11.457,10.208,12,10.479,12,11.5c0,0.708-1.283,1.5-3,1.5-1.571,0-2.765-.679-2.969-1.309a1,1,0,1,0-1.9.617C4.644,13.894,6.646,15,9,15c2.8,0,5-1.538,5-3.5a3.2,3.2,0,0,0-.5-1.843Z" />
	</svg>
);
