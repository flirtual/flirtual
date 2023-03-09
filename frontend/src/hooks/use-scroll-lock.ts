import { RefObject, useCallback, useEffect, useState } from "react";

export function useScrollLock<T extends { style: CSSStyleDeclaration }>(ref?: RefObject<T>) {
	const [locked, setLocked] = useState(false);

	const set = useCallback(
		(locked: boolean) => {
			const { style } = ref?.current ?? document.body;
			if (locked) return void (style.overflow = "hidden");
			style.overflow = "";
		},
		[ref]
	);

	useEffect(() => {
		set(locked);
		return () => set(false);
	}, [locked, set]);

	return [locked, setLocked] as const;
}
