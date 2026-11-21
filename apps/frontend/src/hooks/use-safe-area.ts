import { useSyncExternalStore } from "react";

export interface SafeArea {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

const noSafeArea: SafeArea = { top: 0, right: 0, bottom: 0, left: 0 };

function sameInsets(a: SafeArea, b: SafeArea) {
	return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}

export function createSafeAreaStore(
	measure: () => SafeArea,
	listenForChanges: (onChange: () => void) => void
) {
	let snapshot = noSafeArea;
	let listening = false;
	const subscribers = new Set<() => void>();

	const remeasureAndNotify = () => {
		const measured = measure();
		if (sameInsets(snapshot, measured)) return;

		snapshot = measured;
		for (const notify of subscribers) notify();
	};

	return {
		getSnapshot: () => snapshot,
		subscribe(subscriber: () => void) {
			subscribers.add(subscriber);
			if (!listening) {
				listening = true;
				listenForChanges(remeasureAndNotify);
				remeasureAndNotify();
			}

			return () => subscribers.delete(subscriber);
		}
	};
}

function createInsetProbe(corner: string, widthInset: string, heightInset: string) {
	const probe = document.createElement("div");
	probe.ariaHidden = "true";
	probe.style.cssText = `position:fixed;${corner};visibility:hidden;pointer-events:none;width:var(${widthInset},0px);height:var(${heightInset},0px)`;
	document.body.append(probe);
	return probe;
}

let insetProbes: { topLeft: HTMLElement; bottomRight: HTMLElement } | undefined;
let insetProbeObserver: ResizeObserver | undefined;

function getInsetProbes() {
	if (!insetProbes?.topLeft.isConnected || !insetProbes.bottomRight.isConnected) {
		insetProbes?.topLeft.remove();
		insetProbes?.bottomRight.remove();
		insetProbeObserver?.disconnect();
		insetProbes = {
			topLeft: createInsetProbe("top:0;left:0", "--safe-area-inset-left", "--safe-area-inset-top"),
			bottomRight: createInsetProbe("bottom:0;right:0", "--safe-area-inset-right", "--safe-area-inset-bottom")
		};
		insetProbeObserver?.observe(insetProbes.topLeft);
		insetProbeObserver?.observe(insetProbes.bottomRight);
	}
	return insetProbes;
}

function measureInsetProbes() {
	const { topLeft, bottomRight } = getInsetProbes();
	return { topLeft: topLeft.getBoundingClientRect(), bottomRight: bottomRight.getBoundingClientRect() };
}

export function measureSafeArea(): SafeArea {
	const { topLeft, bottomRight } = measureInsetProbes();
	return {
		top: topLeft.height,
		right: bottomRight.width,
		bottom: bottomRight.height,
		left: topLeft.width
	};
}

export function measureSafeAreaBounds() {
	const { topLeft, bottomRight } = measureInsetProbes();
	return { left: topLeft.right, top: topLeft.bottom, right: bottomRight.left, bottom: bottomRight.top };
}

function listenForSafeAreaChanges(onChange: () => void) {
	const { topLeft, bottomRight } = getInsetProbes();
	insetProbeObserver = new ResizeObserver(onChange);
	insetProbeObserver.observe(topLeft);
	insetProbeObserver.observe(bottomRight);
}

const safeAreaStore = createSafeAreaStore(measureSafeArea, listenForSafeAreaChanges);

export function useSafeArea(): SafeArea {
	return useSyncExternalStore(safeAreaStore.subscribe, safeAreaStore.getSnapshot, () => noSafeArea);
}
