import { accessToken } from "../consts";
import { Classification } from "../classifiers";

import { url } from ".";

export const list = (options: { size: number }) =>
	fetch(url("/v1/images/scan-queue", options), {
		headers: {
			authorization: `Bearer ${accessToken}`
		}
	}).then((res) => res.json()) as Promise<Array<string>>;

export const update = (data: Record<string, Classification>) => {
	return fetch(url("/v1/images/scan-queue"), {
		method: "post",
		headers: {
			authorization: `Bearer ${accessToken}`,
			"content-type": "application/json"
		},
		body: JSON.stringify({ data })
	}).then((res) => res.json());
};
