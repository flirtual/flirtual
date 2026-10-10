import type { StepOptions } from "shepherd.js";

type Middleware = Exclude<NonNullable<NonNullable<StepOptions["floatingUIOptions"]>["middleware"]>[number], false | null | undefined>;

// The safe area, narrowed to the split layout's main pane if asked.
export function tourArea({ pane: withinPane = false } = {}) {
	const probe = document.createElement("div");
	probe.style.cssText = "position: fixed; visibility: hidden; pointer-events: none; inset: var(--safe-area-inset-top, 0px) var(--safe-area-inset-right, 0px) var(--safe-area-inset-bottom, 0px) var(--safe-area-inset-left, 0px);";
	document.body.append(probe);
	let { left, top, right, bottom } = probe.getBoundingClientRect();
	probe.remove();

	const pane = withinPane ? document.querySelector("[data-split-main]")?.getBoundingClientRect() : null;
	if (pane && pane.width > 0) {
		left = Math.max(left, pane.left);
		right = Math.min(right, pane.right);
	}

	return { left, top, right, bottom };
}

// How far the rotated arrow's tip pokes out past the popover.
const arrowReach = 16 * Math.SQRT2 - 16;
const targetGap = 6;

const popoverPadding = 16;
// Half the arrow, plus Shepherd's arrow padding.
const arrowInset = 16 + 4;

// Clears the target with the arrow and keeps the popover within the tour area.
export const withinTourArea: Middleware = {
	name: "withinTourArea",
	fn: ({ x, y, placement, rects, elements }) => {
		const offset = arrowReach + targetGap;
		const side = placement.split("-")[0];
		if (side === "top") y -= offset;
		if (side === "bottom") y += offset;
		if (side === "left") x -= offset;
		if (side === "right") x += offset;

		const area = tourArea();
		const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));

		x = clamp(x, area.left + window.scrollX, area.right + window.scrollX - rects.floating.width);
		y = clamp(y, area.top + window.scrollY, area.bottom + window.scrollY - rects.floating.height);

		// Lets an up arrow continue the header's gradient.
		const header = rects.floating.width - popoverPadding * 2;
		const center = rects.reference.x + rects.reference.width / 2 - x - popoverPadding;
		const { style } = elements.floating;
		style.setProperty("--tour-header-width", `${header}px`);
		style.setProperty("--tour-arrow-x", `${clamp(center, arrowInset, header - arrowInset)}px`);

		return { x, y };
	}
};

export function centerInTourArea() {
	const { left, top, right, bottom } = tourArea({ pane: true });
	const { style } = document.documentElement;
	style.setProperty("--tour-center-x", `${(left + right) / 2}px`);
	style.setProperty("--tour-center-y", `${(top + bottom) / 2}px`);
}
