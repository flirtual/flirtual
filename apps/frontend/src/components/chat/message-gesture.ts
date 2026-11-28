import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

import { claimSwipes } from "~/hooks/use-back-button";

import { messageList, popover } from "./selectors";
import { avatarBeside } from "./sticky-avatars";

// A touch on a message either holds still (opening its actions) or slides right (replying to it).
// Moving any other way, or the browser taking over to scroll, abandons it.

export const holdDuration = 450;
export const replyDistance = 56;
const slop = 10;
const maxDistance = 80;
const edgeWidth = 24;

export type Gesture
	= | { state: "held"; pointerId: number }
		| { state: "idle" }
		| { state: "pressing"; pointerId: number; x: number; y: number; slides: boolean }
		| { state: "sliding"; pointerId: number; x: number; distance: number };

export type GestureEvent
	= | { type: "cancel"; pointerId: number }
		| { type: "down"; pointerId: number; x: number; y: number; slides: boolean }
		| { type: "holdElapsed" }
		| { type: "move"; pointerId: number; x: number; y: number }
		| { type: "up"; pointerId: number };

export type GestureEffect = "capture" | "hold" | "reply" | "startHold" | "stopHold";

const idle: Gesture = { state: "idle" };

const handleReach = 32;

export function nearSelection(x: number, y: number) {
	const selection = getSelection();
	if (!selection || selection.isCollapsed || selection.rangeCount === 0) return false;

	// iOS can draw a handle outside the selection's rects.
	const range = selection.getRangeAt(0);
	const ancestor = range.commonAncestorContainer;
	const bubble = (ancestor instanceof Element ? ancestor : ancestor.parentElement)?.closest("[data-bubble]");
	const rects = [...range.getClientRects(), ...bubble ? [bubble.getBoundingClientRect()] : []];

	return rects.some(({ left, right, top, bottom }) =>
		x >= left - handleReach && x <= right + handleReach && y >= top - handleReach && y <= bottom + handleReach);
}

export function nextGesture(gesture: Gesture, event: GestureEvent): [Gesture, Array<GestureEffect>] {
	// iOS can take a touch over for text selection without ending it.
	if (event.type === "down") return [{ state: "pressing", pointerId: event.pointerId, x: event.x, y: event.y, slides: event.slides }, ["startHold"]];

	switch (gesture.state) {
		case "idle":
			return [gesture, []];

		case "pressing": {
			if (event.type === "holdElapsed") return [{ state: "held", pointerId: gesture.pointerId }, ["hold"]];
			if (event.pointerId !== gesture.pointerId) return [gesture, []];
			if (event.type !== "move") return [idle, ["stopHold"]];

			const dx = event.x - gesture.x;
			const dy = Math.abs(event.y - gesture.y);
			if (Math.max(Math.abs(dx), dy) < slop) return [gesture, []];
			if (dx < dy || !gesture.slides) return [idle, ["stopHold"]];

			return [{ state: "sliding", pointerId: gesture.pointerId, x: gesture.x + slop, distance: 0 }, ["stopHold", "capture"]];
		}

		case "sliding": {
			if (event.type === "holdElapsed" || event.pointerId !== gesture.pointerId) return [gesture, []];
			if (event.type === "cancel") return [idle, []];
			if (event.type === "up") return [idle, gesture.distance >= replyDistance ? ["reply"] : []];

			const distance = Math.min(Math.max(event.x - gesture.x, 0), maxDistance);
			return [{ ...gesture, distance }, []];
		}

		case "held":
			return (event.type === "up" || event.type === "cancel") && event.pointerId === gesture.pointerId
				? [idle, []]
				: [gesture, []];
	}
}

export function useMessageGesture({ root, movesAvatar, onHold, onReply }: {
	root: RefObject<HTMLElement | null>;
	movesAvatar: boolean;
	onHold?: () => void;
	onReply?: () => void;
}) {
	const gesture = useRef<Gesture>(idle);
	const held = useRef(false);
	const [sliding, setSliding] = useState(false);
	const avatar = useRef<HTMLElement>(null);

	const releaseAvatar = () => {
		avatar.current?.style.removeProperty("transition");
		avatar.current?.style.removeProperty("transform");
		avatar.current = null;
	};
	useEffect(() => releaseAvatar, []);

	function slide(distance: number) {
		setSliding(distance > 0);
		if (!distance) return releaseAvatar();

		const element = root.current;
		if (!element) return;

		element.style.setProperty("--slide", `${distance}px`);
		element.style.setProperty("--slide-progress", String(Math.min(distance / replyDistance, 1)));

		if (movesAvatar) avatar.current ??= avatarBeside(element);
		if (!avatar.current) return;

		avatar.current.style.transition = "none";
		avatar.current.style.transform = `translateX(${distance}px)`;
	}
	const presses = useRef(0);
	const [holdPending, setHoldPending] = useState<number | null>(null);
	const releaseSwipes = useRef<() => void>(null);

	function dispatch(event: GestureEvent, element?: Element) {
		const [next, effects] = nextGesture(gesture.current, event);
		gesture.current = next;
		slide(next.state === "sliding" ? next.distance : 0);

		for (const effect of effects) {
			switch (effect) {
				case "startHold":
					setHoldPending(++presses.current);
					break;
				case "stopHold":
					setHoldPending(null);
					break;
				case "capture":
					if (element && "pointerId" in event) element.setPointerCapture(event.pointerId);
					break;
				case "hold":
					setHoldPending(null);
					held.current = true;
					onHold?.();
					break;
				case "reply":
					onReply?.();
					break;
			}
		}
	}

	const holdElapsed = useEffectEvent(() => dispatch({ type: "holdElapsed" }));

	useEffect(() => {
		if (holdPending === null) return;

		const timer = window.setTimeout(holdElapsed, holdDuration);
		return () => window.clearTimeout(timer);
	}, [holdPending]);

	const release = () => {
		releaseSwipes.current?.();
		releaseSwipes.current = null;
	};
	useEffect(() => release, []);

	const enabled = !!onHold || !!onReply;
	// A reaction picker opened from the message is inside it, but its touches aren't the message's.
	const fromTouch = (event: ReactPointerEvent) => enabled && event.pointerType === "touch"
		&& !(event.target instanceof Element && event.target.closest(popover));

	return {
		sliding,
		handlers: {
			onPointerDown: (event: ReactPointerEvent) => {
				held.current = false;
				if (!fromTouch(event) || nearSelection(event.clientX, event.clientY)) return;

				const chat = event.currentTarget.closest(messageList)?.getBoundingClientRect();
				const slides = !!onReply && event.clientX - (chat?.left ?? 0) >= edgeWidth;
				release();
				if (slides) releaseSwipes.current = claimSwipes();
				dispatch({ type: "down", pointerId: event.pointerId, x: event.clientX, y: event.clientY, slides });
			},
			onPointerMove: (event: ReactPointerEvent) => {
				if (fromTouch(event)) dispatch({ type: "move", pointerId: event.pointerId, x: event.clientX, y: event.clientY }, event.currentTarget);
			},
			onPointerUp: (event: ReactPointerEvent) => {
				if (!fromTouch(event)) return;
				release();
				dispatch({ type: "up", pointerId: event.pointerId });
			},
			onPointerCancel: (event: ReactPointerEvent) => {
				if (!fromTouch(event)) return;
				release();
				dispatch({ type: "cancel", pointerId: event.pointerId });
			},
			onContextMenu: (event: React.MouseEvent) => {
				if (gesture.current.state !== "idle") event.preventDefault();
			},
			// Lifting the finger after a hold would otherwise click whatever is beneath it.
			onTouchEnd: (event: React.TouchEvent) => {
				if (held.current) event.preventDefault();
			}
		}
	};
}
