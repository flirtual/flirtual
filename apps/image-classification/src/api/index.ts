import { apiUrl } from "../consts";

export function url(pathname: string,	query: Record<string, number | string> = {}) {
	return new URL(
		`${pathname}${
			Object.keys(query).length > 0
				? `?${new URLSearchParams(
					Object.fromEntries(
						Object.entries(query).map(([k, v]) => [k, String(v)])
					)
				).toString()}`
				: ""
		}`,
		apiUrl
	);
}
