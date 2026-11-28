// The chat fills the viewport below the conversation header, any banner and the navigation.
const height = [
	"[--chatbox-header:max(var(--status-bar-height,0rem),calc(max(calc(var(--status-bar-inset-top,var(--safe-area-inset-top,0rem))_+_0.25rem),0.75rem)_+_3.375rem))]",
	"split:[--chatbox-header:calc(var(--safe-area-inset-top,0rem)_+_4rem)]",
	"[--chatbox-below:calc(max(calc(var(--safe-area-inset-bottom,0rem)_-_0.25rem),0.5rem)_+_4rem)]",
	// Natively, the composer's own padding sits in the safe area, overlapping the space reserved for
	// it. Above a tab bar along the bottom, that padding counts towards the gap kept from the bar.
	"native-nav:[--chatbox-below:max(calc(var(--safe-area-inset-bottom,0rem)_-_0.75rem_+_var(--tab-bar-gap,0rem)),0rem)]",
	// The layout pulls the page up under a banner, into the top safe area the banner already pads.
	"[--chatbox-banner:max(0rem,calc(var(--banner-height,0rem)_+_min(0rem,calc(0.5rem_-_var(--safe-area-inset-top,0rem)))))]",
	"h-[calc(var(--viewport-height,100dvh)_-_var(--chatbox-banner)_-_var(--chatbox-header)_-_var(--chatbox-below))]",
	"vision:h-[calc(100dvh_-_8.125rem)]"
].join(" ");

export const frame = `${height} relative w-full overflow-hidden bg-white-20 dark:bg-black-70 vision:bg-transparent native-nav:-mb-[min(var(--safe-area-inset-bottom,0rem),0.75rem)] tab-bar-bottom:mb-0 desktop:mb-0 desktop:max-h-152 desktop:rounded-xl desktop:pt-0 desktop:before:pointer-events-none desktop:before:absolute desktop:before:inset-0 desktop:before:z-10 desktop:before:size-full desktop:before:rounded-xl desktop:before:shadow-brand-inset desktop:before:content-['']`;
