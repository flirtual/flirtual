import { useRef } from "react";
import { useLocation } from "react-router";

export function useLocationChanged(onChange: () => void) {
	const location = useLocation();
	const initialLocationReference = useRef(location);

	if (location.key !== initialLocationReference.current.key) onChange();
}
