/* eslint-disable no-console */

const logOnceSymbol = Symbol.for("logOnce");

declare global {
	// eslint-disable-next-line vars-on-top
	var [logOnceSymbol]: Set<string>;
}

function getHistory() {
	if (!(globalThis as any)[logOnceSymbol]) {
		(globalThis as any)[logOnceSymbol] = new Set<string>();
	}

	return (globalThis as any)[logOnceSymbol] as Set<string>;
}

export function logOnce(...messages: Array<string>) {
	if (messages.length === 0) return;

	const history = getHistory();
	const key = messages.join(" ");
	if (history.has(key)) return;

	console.log(...messages);
	history.add(key);
}

export function warnOnce(...messages: Array<string>) {
	if (messages.length === 0) return;

	const history = getHistory();
	const key = messages.join(" ");
	if (history.has(key)) return;

	console.warn(...messages);
	history.add(key);
}
