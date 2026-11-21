import { useEffect, useState } from "react";

export function useScrollLock() {
	const [locked, setLocked] = useState(false);

	useEffect(() => {
		const { style } = document.body;
		style.overflow = locked ? "hidden" : "";
		return () => void (style.overflow = "");
	}, [locked]);

	return [locked, setLocked] as const;
}
