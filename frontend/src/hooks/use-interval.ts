import { useCallback, useDebugValue, useEffect, useRef } from "react";

export function useInterval(fn: () => void, timeout: number) {
	const ref = useRef<ReturnType<typeof setInterval> | null>(null);

	const clear = useCallback(() => {
		if (ref.current === null) return;
		clearInterval(ref.current);
	}, []);

	const reset = useCallback(() => {
		clear();
		ref.current = setInterval(fn, timeout);
	}, [clear, fn, timeout]);

	useEffect(() => {
		reset();
		return () => clear();
	}, [reset, clear]);

	useDebugValue(ref.current);

	return { ref, clear, reset };
}
