declare global {
	interface Window {
		fwSettings: Record<string, unknown>;
		FreshworksWidget: (...args: Array<unknown>) => void;
	}
}

/* eslint-disable */
// @ts-expect-error
!function(){if("function"!=typeof window.FreshworksWidget){var n=function(){n.q.push(arguments)};n.q=[],window.FreshworksWidget=n}}() 
/* eslint-enable */

window.fwSettings = { widget_id: 73000002566 };
window.FreshworksWidget("hide", "launcher");

const element = document.createElement("script");
element.setAttribute("src", "https://widget.freshworks.com/widgets/73000002566.js");

document.body.appendChild(element);
export {};
