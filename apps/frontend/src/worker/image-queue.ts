/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../worker-configuration.d.ts" />

/* eslint-disable no-console */
import { env } from "cloudflare:workers";
import invariant from "tiny-invariant";

const {
	BASE_ORIGIN: baseOrigin,
	BUCKET_UPLOADS_ORIGIN: bucketUploadsOrigin,
	API_URL: apiUrl,
	IMAGE_ACCESS_TOKEN: imageAccessToken,
} = env;

invariant(baseOrigin, "BASE_ORIGIN is not defined");
invariant(bucketUploadsOrigin, "BUCKET_UPLOADS_ORIGIN is not defined");
invariant(apiUrl, "API_URL is not defined");
invariant(imageAccessToken, "IMAGE_ACCESS_TOKEN is not defined");

const imageVariants = [
	{
		name: "full",
		fit: "scale-down",
		width: 1920,
		height: 1920,
		metadata: "none"
	},
	{
		name: "profile",
		fit: "cover",
		width: 1008,
		height: 1008,
		metadata: "none"
	},
	{
		name: "thumb",
		fit: "cover",
		width: 160,
		height: 160,
		metadata: "none"
	},
	{
		name: "icon",
		fit: "cover",
		width: 64,
		height: 64,
		metadata: "none"
	},
	{
		name: "blur",
		fit: "cover",
		width: 64,
		height: 64,
		blur: 10,
		metadata: "none"
	}
];

export const queue: ExportedHandler<Env, {
	bucket: string;
	object: {
		key: string;
	};
}>["queue"] = async ({ messages }) => {
	await Promise.all(messages.map(async (message) => {
		const { id: messageId, body, attempts } = message;

		try {
			const id = crypto.randomUUID();
			const blurId = crypto.randomUUID();

			const key = body.object.key;
			const originalUrl = new URL(key, bucketUploadsOrigin).href;

			const head = await env.SOURCE_BUCKET.head(key);
			if (!head || !head.httpMetadata?.contentType) return message.ack();

			const type = head.httpMetadata.contentType;

			if (!["image/gif", "image/jpeg", "image/png", "image/webp"].includes(type)) {
				console.log(`Message ${messageId}: skipping ${originalUrl} due to unsupported type ${type}`);
				return message.ack();
			}

			console.log(`Message ${messageId}: ${originalUrl} → ${JSON.stringify({ id, blurId, type })}`);
			await Promise.all(imageVariants.map(async (option) => {
				const variantUrl = `${baseOrigin}/cdn-cgi/image/fit=${option.fit},width=${option.width},height=${option.height}${option.blur ? `,blur=${option.blur}` : ""},quality=90,metadata=none/${originalUrl}`;
				console.log(`↓ ${option.name}: ${variantUrl}`);

				const result = await fetch(variantUrl);
				const blob = await result.blob();

				await env.DESTINATION_BUCKET.put(`${option.name === "blur" ? blurId : id}/${option.name}`, blob);
			}));

			await fetch(`${apiUrl}/images/variants`, {
				method: "post",
				headers: {
					authorization: `Bearer ${imageAccessToken}`,
					"content-type": "application/json"
				},
				body: JSON.stringify({
					original_file: key,
					external_id: id,
					blur_id: blurId
				})
			});

			message.ack();
		}
		catch (reason) {
			console.error(reason);
			message.retry({ delaySeconds: attempts ** 2 });
		}
	}));
};
