import { useCallback, useEffect, useRef } from "react";

export function useAnimationFrame(fn: FrameRequestCallback) {
	const ref = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

	const callback = useCallback<FrameRequestCallback>(
		(time) => {
			ref.current = requestAnimationFrame(callback);
			fn(time);
		},
		[fn]
	);

	const cancel = useCallback(() => {
		if (ref.current === null) return;
		cancelAnimationFrame(ref.current);
	}, []);

	const reset = useCallback(() => {
		cancel();
		ref.current = requestAnimationFrame(callback);
	}, [cancel, callback]);

	useEffect(() => {
		reset();
	});

	return { ref, cancel, reset };
}
