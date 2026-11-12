import { useEffect, useEffectEvent, useState } from "react";
import { useLocation } from "react-router";

export function useLocationChanged(onChange: () => void) {
	const { key } = useLocation();
	const [initialKey] = useState(key);
	const changed = useEffectEvent(onChange);

	useEffect(() => {
		if (key !== initialKey) changed();
	}, [key, initialKey]);
}
