import { apiUrl, imageAccessToken } from "./environment";

export async function updateVariants(payload: {
	originalFile: string;
	externalId: string;
	blurId: string;
}): Promise<void> {
	const response = await fetch(`${apiUrl}/images/variants`, {
		method: "post",
		headers: {
			authorization: `Bearer ${imageAccessToken}`,
			"content-type": "application/json"
		},
		body: JSON.stringify({
			original_file: payload.originalFile,
			external_id: payload.externalId,
			blur_id: payload.blurId
		})
	});

	if (!response.ok)
		throw new Error(`API returned ${response.status} for ${payload.originalFile}`, { cause: response });
}
