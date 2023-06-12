import { apiUrl } from "../consts";

export const url = (
	pathname: string,
	query: Record<string, string | number> = {}
) =>
	new URL(
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
