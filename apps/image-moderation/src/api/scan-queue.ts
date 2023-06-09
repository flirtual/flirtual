import { accessToken } from "../consts";
import { Classification } from "../classifiers";

import { url } from ".";

const scanQueueUrl = url("/v1/images/scan-queue");

interface ScanQueue {
	data: Array<string>;
	hash: string;
}

export const list = () =>
	fetch(scanQueueUrl, {
		headers: {
			authorization: `Bearer ${accessToken}`
		}
	}).then((res) => res.json()) as Promise<ScanQueue>;

export const update = (data: Record<string, Classification>) => {
	return fetch(scanQueueUrl, {
		method: "post",
		headers: {
			authorization: `Bearer ${accessToken}`,
			"content-type": "application/json"
		},
		body: JSON.stringify({ data })
	}).then((res) => res.json());
};
