import ms from "ms";
import { useCallback, useDebugValue, useEffect, useMemo, useRef } from "react";

export function useInterval(callback: () => void, every: number | string) {
	const reference = useRef<ReturnType<typeof setInterval> | null>(null);

	const interval = useMemo(
		() => (typeof every === "string" ? ms(every) : every),
		[every]
	);

	const clear = useCallback(() => {
		const { current } = reference;
		if (!current) return;

		clearInterval(current);
	}, []);

	const reset = useCallback(() => {
		clear();
		reference.current = setInterval(callback, interval);
	}, [clear, callback, interval]);

	useEffect(() => {
		reset();
		return () => clear();
	}, [reset, clear]);

	useDebugValue(reference.current);

	return { ref: reference, clear, reset };
}
