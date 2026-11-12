import { useEffect, useEffectEvent, useSyncExternalStore } from "react";

let dismissedMessage: string | null = null;

const subscribers = new Set<() => void>();
const reopenListeners = new Set<() => void>();

function subscribe(subscriber: () => void) {
	subscribers.add(subscriber);
	return () => subscribers.delete(subscriber);
}

function setDismissedMessage(message: string | null) {
	dismissedMessage = message;
	subscribers.forEach((subscriber) => subscriber());
}

export function dismissModeratorMessage(message: string) {
	setDismissedMessage(message);
}

export function reopenModeratorMessage() {
	setDismissedMessage(null);
	reopenListeners.forEach((listener) => listener());
}

export function useDismissedModeratorMessage() {
	return useSyncExternalStore(subscribe, () => dismissedMessage, () => null);
}

export function useModeratorMessageReopen(listener: () => void) {
	const onReopen = useEffectEvent(listener);

	useEffect(() => {
		const reopenListener = () => onReopen();
		reopenListeners.add(reopenListener);
		return () => void reopenListeners.delete(reopenListener);
	}, []);
}
