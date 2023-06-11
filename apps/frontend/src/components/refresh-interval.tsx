/* eslint-disable react/hook-use-state */
"use client";

import { FC, ReactNode, useCallback, useState } from "react";

import { useInterval } from "~/hooks/use-interval";

export interface RefreshIntervalProps {
	every: string | number;
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
