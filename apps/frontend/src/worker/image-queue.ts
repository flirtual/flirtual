/* eslint-disable no-console */
import { env } from "cloudflare:workers";

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
		const { id: messageId, body } = message;

		try {
			const id = crypto.randomUUID();
			const blurId = crypto.randomUUID();

			const key = body.object.key;
			const url = `https://${body.bucket}.${new URL(env.VITE_ORIGIN).hostname}/${key}`;

			const head = await env.SOURCE_BUCKET.head(key);
			if (!head || !head.httpMetadata?.contentType) return message.ack();

			const type = head.httpMetadata.contentType;

			if (!["image/gif", "image/jpeg", "image/png", "image/webp"].includes(type)) {
				console.log(`Message ${messageId}: skipping ${url} (${type})`);
				return message.ack();
			}

			console.log(`Message ${messageId}: ${url} -> ${id} ${blurId} (${type})`);

			await Promise.all(imageVariants.map(async (option) => {
				const result = await fetch(`${env.VITE_ORIGIN}/cdn-cgi/image/fit=${option.fit},width=${option.width},height=${option.height}${option.blur ? `,blur=${option.blur}` : ""},quality=90,metadata=none/${url}`);
				const blob = await result.blob();

				await env.DESTINATION_BUCKET.put(`${option.name === "blur" ? blurId : id}/${option.name}`, blob);
			}));

			await fetch(`${env.VITE_API_URL}/images/variants`, {
				method: "post",
				headers: {
					authorization: `Bearer ${env.IMAGE_ACCESS_TOKEN}`,
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
			message.retry({ delaySeconds: 5 });
		}
	}));
};
