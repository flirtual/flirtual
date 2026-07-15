import { useEffect, useRef } from "react";

import { suppressNextClick } from "~/utilities";

let locks = 0;
let previous = "";

// While active, the rest of the page ignores pointer events. Re-enable
// pointer-events on the elements that should stay interactive.
//
// Presses swallowed by the lock land on the document root; onOutsidePress
// receives them at pointerdown time, and their click is discarded — closing
// lifts the lock before the press's own click fires, which would otherwise
// land on (and activate) the real element.
export function useDisableOutsidePointerEvents(
	active: boolean,
	onOutsidePress?: (event: PointerEvent) => void
) {
	const onOutsidePressReference = useRef(onOutsidePress);
	onOutsidePressReference.current = onOutsidePress;

	useEffect(() => {
		if (!active) return;

		if (locks === 0) {
			previous = document.body.style.pointerEvents;
			document.body.style.pointerEvents = "none";
		}

		locks++;

		const onPointerDown = (event: PointerEvent) => {
			if (event.target instanceof Node && document.body.contains(event.target))
				return;

			// Don't dismiss on touch pan.
			if (event.pointerType === "touch") {
				suppressNextClick(() => onOutsidePressReference.current?.(event));
				return;
			}

			suppressNextClick();
			onOutsidePressReference.current?.(event);
		};

		document.addEventListener("pointerdown", onPointerDown, { capture: true });

		return () => {
			document.removeEventListener("pointerdown", onPointerDown, {
				capture: true
			});

			locks--;
			if (locks === 0) document.body.style.pointerEvents = previous;
		};
	}, [active]);
}
