/* eslint-disable no-console */

const history = new Set<string>();

export function logOnce(...messages: Array<string>) {
	if (messages.length === 0) return;

	const key = messages.join(" ");
	if (history.has(key)) return;

	console.log(...messages);
	history.add(key);
}

export function warnOnce(...messages: Array<string>) {
	if (messages.length === 0) return;

	const key = messages.join(" ");
	if (history.has(key)) return;

	console.warn(...messages);
	history.add(key);
}
