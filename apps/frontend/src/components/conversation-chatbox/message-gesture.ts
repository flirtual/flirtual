import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

// A touch on a message either holds still (opening its actions) or slides inward (replying to it).
// Moving any other way, or the browser taking over to scroll, abandons it.

export const holdDuration = 450;
export const replyDistance = 56;
const slop = 10;
const maxDistance = 80;

export type Gesture
	= | { state: "held"; pointerId: number }
		| { state: "idle" }
		| { state: "pressing"; pointerId: number; x: number; y: number }
		| { state: "sliding"; pointerId: number; x: number; distance: number };

export type GestureEvent
	= | { type: "cancel"; pointerId: number }
		| { type: "down"; pointerId: number; x: number; y: number }
		| { type: "holdElapsed" }
		| { type: "move"; pointerId: number; x: number; y: number }
		| { type: "up"; pointerId: number };

export type GestureEffect = "capture" | "hold" | "reply" | "startHold" | "stopHold";

const idle: Gesture = { state: "idle" };

/** Inward is +1 for messages on the left, sliding right, and -1 for those on the right. */
export function nextGesture(gesture: Gesture, event: GestureEvent, inward: -1 | 1): [Gesture, Array<GestureEffect>] {
	switch (gesture.state) {
		case "idle":
			return event.type === "down"
				? [{ state: "pressing", pointerId: event.pointerId, x: event.x, y: event.y }, ["startHold"]]
				: [gesture, []];

		case "pressing": {
			if (event.type === "holdElapsed") return [{ state: "held", pointerId: gesture.pointerId }, ["hold"]];
			if (event.type === "down" || event.pointerId !== gesture.pointerId) return [gesture, []];
			if (event.type !== "move") return [idle, ["stopHold"]];

			const dx = (event.x - gesture.x) * inward;
			const dy = Math.abs(event.y - gesture.y);
			if (Math.max(Math.abs(dx), dy) < slop) return [gesture, []];
			if (dx < dy) return [idle, ["stopHold"]];

			return [{ state: "sliding", pointerId: gesture.pointerId, x: gesture.x + slop * inward, distance: 0 }, ["stopHold", "capture"]];
		}

		case "sliding": {
			if (event.type === "holdElapsed" || event.type === "down" || event.pointerId !== gesture.pointerId) return [gesture, []];
			if (event.type === "cancel") return [idle, []];
			if (event.type === "up") return [idle, gesture.distance >= replyDistance ? ["reply"] : []];

			const distance = Math.min(Math.max((event.x - gesture.x) * inward, 0), maxDistance);
			return [{ ...gesture, distance }, []];
		}

		case "held":
			return (event.type === "up" || event.type === "cancel") && event.pointerId === gesture.pointerId
				? [idle, []]
				: [gesture, []];
	}
}

export function useMessageGesture({ inward, onHold, onReply }: {
	inward: -1 | 1;
	onHold?: () => void;
	onReply?: () => void;
}) {
	const gesture = useRef<Gesture>(idle);
	const held = useRef(false);
	const [distance, setDistance] = useState(0);
	const [holdPending, setHoldPending] = useState(false);

	function dispatch(event: GestureEvent, element?: Element) {
		const [next, effects] = nextGesture(gesture.current, event, inward);
		gesture.current = next;
		setDistance(next.state === "sliding" ? next.distance : 0);

		for (const effect of effects) {
			switch (effect) {
				case "startHold":
					setHoldPending(true);
					break;
				case "stopHold":
					setHoldPending(false);
					break;
				case "capture":
					if (element && "pointerId" in event) element.setPointerCapture(event.pointerId);
					break;
				case "hold":
					setHoldPending(false);
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
		if (!holdPending) return;

		const timer = window.setTimeout(holdElapsed, holdDuration);
		return () => window.clearTimeout(timer);
	}, [holdPending]);

	const enabled = !!onHold || !!onReply;
	const fromTouch = (event: ReactPointerEvent) => enabled && event.pointerType === "touch";

	return {
		distance,
		handlers: {
			onPointerDown: (event: ReactPointerEvent) => {
				held.current = false;
				if (fromTouch(event)) dispatch({ type: "down", pointerId: event.pointerId, x: event.clientX, y: event.clientY });
			},
			onPointerMove: (event: ReactPointerEvent) => {
				if (fromTouch(event)) dispatch({ type: "move", pointerId: event.pointerId, x: event.clientX, y: event.clientY }, event.currentTarget);
			},
			onPointerUp: (event: ReactPointerEvent) => {
				if (fromTouch(event)) dispatch({ type: "up", pointerId: event.pointerId });
			},
			onPointerCancel: (event: ReactPointerEvent) => {
				if (fromTouch(event)) dispatch({ type: "cancel", pointerId: event.pointerId });
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
