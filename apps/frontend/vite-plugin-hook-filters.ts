import type { Plugin } from "vite";

type FilterableHook = "load" | "resolveId" | "transform";
type HookFilter<Name extends FilterableHook> = NonNullable<Extract<NonNullable<Plugin[Name]>, { handler: unknown }>["filter"]>;
export type HookFilters = { [Name in FilterableHook]?: HookFilter<Name> };

// Narrows a plugin's hooks with Rolldown hook filters, so modules a hook would skip never cross
// into JavaScript (https://rolldown.rs/apis/plugin-api/hook-filters). Each key given here replaces
// the same key of the hook's own filter; its other keys still apply.
export function withHookFilters(plugin: Plugin, filters: HookFilters): Plugin {
	const filtered: Plugin = { ...plugin };

	for (const name of Object.keys(filters) as Array<FilterableHook>) {
		const hook = plugin[name];
		const filter = filters[name];
		if (!hook || !filter) continue;

		const { handler, filter: existing, ...rest } = typeof hook === "function" ? { handler: hook, filter: undefined } : hook;
		Object.assign(filtered, { [name]: { ...rest, filter: { ...existing, ...filter }, handler } });
	}

	return filtered;
}

// Each filter matches the same modules as the early return at the top of its hook in
// @react-router/dev's vite.js, or a superset of them. React Router adds its own filters in
// https://github.com/remix-run/react-router/pull/15476; drop this table once a release includes it.
export const reactRouterHookFilters: Record<string, HookFilters> = {
	"react-router": { transform: { id: /\.module\.(?:css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/ } },
	"react-router:build-client-route": { transform: { id: /\?__react-router-build-client-route$/ } },
	"react-router:split-route-modules": { transform: { id: /\?route-chunk=/ } },
	"react-router:virtual-modules": {
		resolveId: { id: /^virtual:react-router\// },
		load: { id: /^\0virtual:react-router\// }
	},
	"react-router:dot-client": { transform: { id: /\.client(?:\.[cm]?[jt]sx?)?$|\/\.client\// } },
	"react-router:inject-hmr-runtime": {
		resolveId: { id: /^virtual:react-router\/inject-hmr-runtime$/ },
		load: { id: /^\0virtual:react-router\/inject-hmr-runtime$/ }
	},
	"react-router:hmr-runtime": {
		resolveId: { id: /^virtual:react-router\/hmr-runtime$/ },
		load: { id: /^\0virtual:react-router\/hmr-runtime$/ }
	}
};
