/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { withSuspense } from "with-suspense";

import { usePreferences } from "~/hooks/use-preferences";

export const snowfallOptions = ["always", "auto", "never"] as const;
export type SnowfallOption = typeof snowfallOptions[number];

function isCheerful() {
	const now = new Date();

	// December 24th to 31st.
	return now.getMonth() === 11
		&& now.getDate() >= 24
		&& now.getDate() <= 31;
}

export function useSnowfall() {
	const [snowfall, setSnowfall] = usePreferences<SnowfallOption>("snowfall", "auto");

	const on = snowfall === "always" || (snowfall === "auto" && isCheerful());
	return { on, snowfall, setSnowfall };
}

const Snowfall = lazy(() => import("react-snowfall"));

export const ConditionalSnowfall = withSuspense(() => {
	const { on } = useSnowfall();
	if (!on) return null;

	return <Snowfall />;
});
