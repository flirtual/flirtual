import { useEffect, useSyncExternalStore } from "react";

const replying = new Set<string>();
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((subscriber) => subscriber());

function subscribe(subscriber: () => void) {
	subscribers.add(subscriber);
	return () => subscribers.delete(subscriber);
}

export function useReplyingTo(messageId: string) {
	useEffect(() => {
		replying.add(messageId);
		notify();
		return () => {
			replying.delete(messageId);
			notify();
		};
	}, [messageId]);
}

export function useBeingRepliedTo(messageId: string) {
	return useSyncExternalStore(subscribe, () => replying.has(messageId), () => false);
}

const highlightDuration = 1000;
const highlighted = new Map<string, ReturnType<typeof setTimeout>>();

export function highlightMessage(messageId: string) {
	clearTimeout(highlighted.get(messageId));
	highlighted.set(messageId, setTimeout(() => {
		highlighted.delete(messageId);
		notify();
	}, highlightDuration));
	notify();
}

export function useHighlighted(messageId: string) {
	return useSyncExternalStore(subscribe, () => highlighted.has(messageId), () => false);
}
