import { type RefObject, useCallback, useEffect, useState } from "react";

export function useScrollLock<T extends { style: CSSStyleDeclaration }>(
	reference?: RefObject<T>
) {
	const [locked, setLocked] = useState(false);

	const set = useCallback(
		(locked: boolean) => {
			const { style } = reference?.current ?? document.body;
			if (locked) return void (style.overflow = "hidden");
			style.overflow = "";
		},
		[reference]
	);

	useEffect(() => {
		set(locked);
		return () => set(false);
	}, [locked, set]);

	return [locked, setLocked] as const;
}
