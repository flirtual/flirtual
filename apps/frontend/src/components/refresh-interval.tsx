"use client";

import { type FC, type ReactNode, useCallback, useState } from "react";

import { useInterval } from "~/hooks/use-interval";

export interface RefreshIntervalProps {
	every: number | string;
	children: () => ReactNode;
}

export const RefreshInterval: FC<RefreshIntervalProps> = ({
	every,
	children
}) => {
	const [, setValue] = useState(0);

	useInterval(
		useCallback(() => setValue((value) => (value === 1 ? 0 : 1)), []),
		every
	);

	return <>{children()}</>;
};
