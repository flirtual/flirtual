import type Picker from "emoji-picker-element/picker";

import { claimSwipes } from "~/hooks/use-back-button";

const lockDistance = 10;
const switchDistance = 50;
const resistance = 0.3;
const settle = { duration: 200, easing: "ease-out" };

interface Swipe {
	x: number;
	y: number;
	panel: HTMLElement;
	release: () => void;
	horizontal?: boolean;
	offset: number;
	from: number;
	scrollTop: number;
	ghost?: HTMLElement;
	direction?: number;
}

// The picker only renders one category, so the outgoing one is a copy.
export function followTabSwipes(picker: Picker) {
	// Its own event map leaves out touches.
	const element: HTMLElement = picker;
	let swipe: Swipe | null = null;
	let unclaim: (() => void) | undefined;

	const holdSwipes = (target: EventTarget) => {
		unclaim ??= claimSwipes();
		const letGo = (event: Event) => {
			target.removeEventListener("touchend", letGo);
			target.removeEventListener("touchcancel", letGo);
			if ((event as TouchEvent).touches.length > 0) return;
			unclaim?.();
			unclaim = undefined;
		};
		target.addEventListener("touchend", letGo);
		target.addEventListener("touchcancel", letGo);
	};

	const tabs = () => [...picker.shadowRoot?.querySelectorAll<HTMLElement>(".nav-button") ?? []];
	// None is selected while searching.
	const selected = () => tabs().findIndex((tab) => tab.getAttribute("aria-selected") === "true");

	const showOriginal = (current: Swipe) => {
		tabs()[current.from]?.click();
		current.panel.scrollTop = current.scrollTop;
		current.ghost?.remove();
		current.ghost = undefined;
		current.direction = undefined;
	};

	const copy = (panel: HTMLElement) => {
		const ghost = panel.cloneNode(true) as HTMLElement;
		ghost.removeAttribute("id");
		ghost.inert = true;
		Object.assign(ghost.style, { position: "absolute", top: "0", left: "0" });
		panel.after(ghost);

		const at = panel.getBoundingClientRect();
		const placed = ghost.getBoundingClientRect();
		Object.assign(ghost.style, {
			top: `${at.top - placed.top}px`,
			left: `${at.left - placed.left}px`,
			width: `${at.width}px`,
			height: `${at.height}px`
		});
		ghost.scrollTop = panel.scrollTop;
		return ghost;
	};

	const move = (event: TouchEvent) => {
		const [touch] = event.touches;
		if (!swipe || !touch) return;

		const dx = touch.clientX - swipe.x;
		const dy = touch.clientY - swipe.y;
		if (swipe.horizontal === undefined) {
			// iOS can't cancel a scroll once it starts, so block it until the direction is known.
			if (Math.abs(dx) > Math.abs(dy)) event.preventDefault();
			if (Math.max(Math.abs(dx), Math.abs(dy)) < lockDistance) return;

			swipe.horizontal = Math.abs(dx) > Math.abs(dy);
			if (swipe.horizontal) swipe.panel.style.overflowY = "hidden";
		}
		if (!swipe.horizontal) return;

		event.preventDefault();
		const direction = dx < 0 ? 1 : -1;
		const neighbour = tabs()[swipe.from + direction];
		const width = swipe.panel.clientWidth;

		if (!neighbour) {
			if (swipe.ghost) showOriginal(swipe);
			swipe.offset = dx * resistance;
			swipe.panel.style.translate = `${swipe.offset}px 0`;
			return;
		}

		swipe.ghost ??= copy(swipe.panel);
		if (swipe.direction !== direction) {
			neighbour.click();
			swipe.direction = direction;
		}

		swipe.offset = dx;
		swipe.ghost.style.translate = `${dx}px 0`;
		swipe.panel.style.translate = `${dx + direction * width}px 0`;
	};

	const end = async (event: TouchEvent) => {
		const current = swipe;
		if (!current || event.touches.length > 0) return;
		current.release();

		const { panel, ghost, offset, direction } = current;
		panel.style.overflowY = "";
		if (!current.horizontal) {
			swipe = null;
			return;
		}

		if (!ghost || direction === undefined) {
			panel.style.translate = "";
			swipe = null;
			await panel.animate([{ translate: `${offset}px 0` }, { translate: "0 0" }], settle).finished.catch(() => {});
			return;
		}

		const width = panel.clientWidth;
		const switching = event.type === "touchend" && Math.abs(offset) >= switchDistance;
		const ghostTo = switching ? -direction * width : 0;
		const panelTo = switching ? 0 : direction * width;

		const animations = [
			ghost.animate([{ translate: `${offset}px 0` }, { translate: `${ghostTo}px 0` }], { ...settle, fill: "forwards" }),
			panel.animate([{ translate: `${offset + direction * width}px 0` }, { translate: `${panelTo}px 0` }], { ...settle, fill: "forwards" })
		];
		panel.style.translate = "";
		await Promise.all(animations.map(({ finished }) => finished)).catch(() => {});

		if (!switching) showOriginal(current);
		ghost.remove();
		for (const animation of animations) animation.cancel();
		swipe = null;
	};

	const finish = (event: TouchEvent) => void end(event);

	element.addEventListener("touchstart", (event) => {
		const [target] = event.composedPath();
		if (!target) return;
		holdSwipes(target);
		if (swipe) return;

		const [touch] = event.touches;
		const panel = event.composedPath().find((target): target is HTMLElement => target instanceof HTMLElement && target.matches(".tabpanel"));
		const from = selected();
		if (event.touches.length !== 1 || !touch || !panel || from === -1 || panel.getAnimations().length > 0) return;

		// Switching categories removes the touched emoji, and a removed element's touches don't bubble.
		target.addEventListener("touchmove", move as EventListener, { passive: false });
		target.addEventListener("touchend", finish as EventListener);
		target.addEventListener("touchcancel", finish as EventListener);
		const release = () => {
			target.removeEventListener("touchmove", move as EventListener);
			target.removeEventListener("touchend", finish as EventListener);
			target.removeEventListener("touchcancel", finish as EventListener);
		};

		swipe = { x: touch.clientX, y: touch.clientY, panel, release, offset: 0, from, scrollTop: panel.scrollTop };
	}, { passive: true });
}
