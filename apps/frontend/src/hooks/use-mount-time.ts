import { useState } from "react";

export function useMountTime() {
	const [mountTime] = useState(Date.now);
	return mountTime;
}
