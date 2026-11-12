import { useCallback, useEffect, useRef } from "react";

export function useInterval(callback: () => void, every: number, condition = true) {
	const reference = useRef<ReturnType<typeof setInterval> | null>(null);

	const clear = useCallback(() => {
		const { current } = reference;
		if (!current) return;

		// ???
		clearInterval(current as unknown as number);
	}, []);

	const reset = useCallback(() => {
		clear();
		reference.current = setInterval(callback, every);
	}, [clear, callback, every]);

	useEffect(() => {
		if (!condition) return;

		reset();
		return () => clear();
	}, [reset, clear, condition]);

	return { ref: reference, clear, reset };
}

export function useTimeout(callback: () => void, every: number, condition = true) {
	const reference = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clear = useCallback(() => {
		const { current } = reference;
		if (!current) return;

		clearTimeout(current as unknown as number);
	}, []);

	const reset = useCallback(() => {
		clear();
		reference.current = setTimeout(callback, every);
	}, [clear, callback, every]);

	useEffect(() => {
		if (!condition) return;

		reset();
		return () => clear();
	}, [reset, clear, condition]);

	return { ref: reference, clear, reset };
}
