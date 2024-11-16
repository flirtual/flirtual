import { type RefObject, useDebugValue, useEffect } from "react";

export function useEventListener<
	T extends HTMLElement,
	K extends keyof HTMLElementEventMap
>(
	eventName: K,
	callback: (event: HTMLElementEventMap[K]) => void,
	reference: RefObject<T>
) {
	useEffect(() => {
		if (!reference.current) return;
		const element = reference.current;

		element.addEventListener(eventName, callback);
		return () => element.removeEventListener(eventName, callback);
	}, [eventName, reference, callback]);
}

export type GlobalEventSource = "body" | "document" | "window";

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
	const function_ = callback as EventListenerOrEventListenerObject;

	useDebugValue(`${name} on ${source}`);

	useEffect(() => {
		const element
			= source === "document"
				? document
				: source === "window"
					? window
					: document.body;
		if (condition) element.addEventListener(name, function_);

		return () => element.removeEventListener(name, function_);
	}, [name, source, function_, condition]);
}
