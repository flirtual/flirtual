import ms from "ms";
import { useCallback, useDebugValue, useEffect, useMemo, useRef } from "react";

export function useInterval(fn: () => void, every: number | string) {
	const ref = useRef<ReturnType<typeof setInterval> | null>(null);

	const interval = useMemo(() => (typeof every === "string" ? ms(every) : every), [every]);

	const clear = useCallback(() => {
		if (ref.current === null) return;
		clearInterval(ref.current);
	}, []);

	const reset = useCallback(() => {
		clear();
		ref.current = setInterval(fn, interval);
	}, [clear, fn, interval]);

	useEffect(() => {
		reset();
		return () => clear();
	}, [reset, clear]);

	useDebugValue(ref.current);

	return { ref, clear, reset };
}
