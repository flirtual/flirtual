import Alpine from "alpinejs";

import { getCurrentViewName } from "./utilities";

declare global {
	interface Window {
		Alpine: typeof Alpine;
		Blinkloader: {
			optimize: (options: unknown) => void;
		};
	}
}

window.Alpine = Alpine;

async function getComponentData(name: string, local: boolean) {
	const path = local ? `views/${getCurrentViewName()}` : `components/${name}`;
	const module = await import(`/assets/${path}.js`);

	if (local) return module[name];
	return module.default;
}

function getComponentElements() {
	return [...document.querySelectorAll("*[x-component]")] as Array<HTMLElement>;
}

Alpine.directive("hoist", (el, { expression, modifiers, value }) => {
	Alpine.effect(() => {
		const nths = modifiers.map(Number.parseInt);
		for (const nth of nths) {
			const data = Alpine.closestDataStack(el)[nth];
			const curStack = Alpine.closestDataStack(el)[0];

			// @ts-expect-error: no types, oops.
			data[expression || value] = curStack[value];
		}
	});
});

document.addEventListener("DOMContentLoaded", async () => {
	const nodes = getComponentElements();
	for (const node of nodes) {
		const name = node.getAttribute("x-component") || "";
		const local = node.hasAttribute("x-local");

		const data = await getComponentData(name, local);
		Alpine.data(name, data);

		node.setAttribute("x-data", name);
	}

	Alpine.start();
});

window.Blinkloader.optimize({
	pubkey: "130267e8346d9a7e9bea",
	cdnBase: "https://media.flirtu.al",
	lazyload: false,
	smartCompression: true,
	retina: true,
	webp: true,
	responsive: true,
	fadeIn: true
});

// @ts-expect-error: untyped module.
import { Socket } from "phoenix";
// @ts-expect-error: untyped module.
import { LiveSocket } from "phoenix_live_view";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const csrfToken = document.querySelector(`meta[name="csrf-token"]`)!.getAttribute("content");
const liveSocket = new LiveSocket("/live", Socket, { params: { _csrf_token: csrfToken } });
liveSocket.connect();
