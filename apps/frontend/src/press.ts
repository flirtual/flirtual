// Marks the touched element with data-pressed for the hocus variants. As in native lists, the mark
// waits a moment, so a touch that turns into a scroll never shows it, and a scroll clears it.
// :active can't do this: WebKit keeps it until the scroll stops.
const pressDelay = 100;
const tapLinger = 150;

let touched: Element | null = null;
let pressed: Element | null = null;
let timeout: ReturnType<typeof setTimeout> | undefined;

function press() {
	pressed = touched;
	pressed?.setAttribute("data-pressed", "");
}

function release() {
	clearTimeout(timeout);
	touched = null;
	pressed?.removeAttribute("data-pressed");
	pressed = null;
}

document.addEventListener("pointerdown", (event) => {
	release();
	if (event.pointerType === "mouse" || !(event.target instanceof Element)) return;

	touched = event.target;
	timeout = setTimeout(press, pressDelay);
}, { passive: true });

document.addEventListener("pointerup", () => {
	if (!touched) return;

	// Shows taps shorter than the delay too.
	clearTimeout(timeout);
	if (!pressed) press();
	timeout = setTimeout(release, tapLinger);
}, { passive: true });

for (const type of ["pointercancel", "scroll"])
	document.addEventListener(type, release, { capture: true, passive: true });
