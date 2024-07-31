import { accessToken } from "../consts";
import { Classification } from "../classifiers";

import { url } from ".";

export interface Image {
	id: string;
	file: string;
}

export const list = (options: { size: number }) =>
	fetch(url("/v1/images/scan-queue", options), {
		headers: {
			authorization: `Bearer ${accessToken}`
		}
	}).then((response) => response.json()) as Promise<Array<Image>>;

export interface UpdateScanQueue {
	success: Record<string, Classification>;
	failed: Array<string>;
}

export const update = (data: UpdateScanQueue) => {
	return fetch(url("/v1/images/scan-queue"), {
		method: "post",
		headers: {
			authorization: `Bearer ${accessToken}`,
			"content-type": "application/json"
		},
		body: JSON.stringify(data)
	}).then((response) => response.json());
};
