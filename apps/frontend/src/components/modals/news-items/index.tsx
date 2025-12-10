import { lazy } from "react";
import type { ComponentType } from "react";

export interface NewsItem {
	date: string;
	Component: ComponentType<{ onSaved?: () => void }>;
}

export const newsItems: Record<string, NewsItem> = {
	"2025_location": {
		date: "2025-12-09",
		Component: lazy(() => import("./2025-location").then(({ Location2025 }) => ({ default: Location2025 })))
	},
	"2025_catch_up": {
		date: "2025-12-07",
		Component: lazy(() => import("./2025-catch-up").then(({ CatchUp2025 }) => ({ default: CatchUp2025 })))
	},
	"2024_wrapped": {
		date: "2025-01-01",
		Component: lazy(() => import("./2024-wrapped").then(({ Wrapped2024 }) => ({ default: Wrapped2024 })))
	},
	"2024_100k": {
		date: "2024-10-01",
		Component: lazy(() => import("./2024-100k").then(({ HundredK2024 }) => ({ default: HundredK2024 })))
	},
	"2024_homies_day": {
		date: "2024-02-14",
		Component: lazy(() => import("./2024-homies-day").then(({ HomiesDay2024 }) => ({ default: HomiesDay2024 })))
	},
	"2023_apps_themes": {
		date: "2023-10-19",
		Component: lazy(() => import("./2023-apps-themes").then(({ AppsThemes2023 }) => ({ default: AppsThemes2023 })))
	},
	"2023_matchmaking": {
		date: "2023-06-15",
		Component: lazy(() => import("./2023-matchmaking").then(({ Matchmaking2023 }) => ({ default: Matchmaking2023 })))
	},
	"2023_rewrite": {
		date: "2023-04-28",
		Component: lazy(() => import("./2023-rewrite").then(({ Rewrite2023 }) => ({ default: Rewrite2023 })))
	}
};
