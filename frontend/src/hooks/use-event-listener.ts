import { RefObject, useDebugValue, useEffect } from "react";

export function useEventListener<T extends HTMLElement, K extends keyof HTMLElementEventMap>(
	eventName: K,
	callback: (event: HTMLElementEventMap[K]) => void,
	ref: RefObject<T>
) {
	useEffect(() => {
		if (!ref.current) return;
		const element = ref.current;

		element.addEventListener(eventName, callback);
		return () => element.removeEventListener(eventName, callback);
	}, [eventName, ref, callback]);
}

export type GlobalEventSource = "document" | "window" | "body";

export type GlobalEventMap<T extends GlobalEventSource> = T extends "document"
	? DocumentEventMap
	: T extends "window"
	? WindowEventMap
	: T extends "body"
	? HTMLElementEventMap
	: never;

export function useGlobalEventListener<
	T extends GlobalEventSource,
	K extends keyof GlobalEventMap<T>
>(
	source: T,
	eventName: K,
	callback: (event: GlobalEventMap<T>[K]) => void,
	condition: boolean = true
) {
	const name = String(eventName);
	const fn = callback as EventListenerOrEventListenerObject;

	useDebugValue(`${name} on ${source}`);

	useEffect(() => {
		const element = source === "document" ? document : source === "window" ? window : document.body;
		if (condition) element.addEventListener(name, fn);

		return () => element.removeEventListener(name, fn);
	}, [name, source, fn, condition]);
}
