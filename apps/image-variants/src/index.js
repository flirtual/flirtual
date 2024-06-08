import path from "node:path";

const variants = [
	{
		"name": "full",
		"fit": "scale-down",
		"width": 1920,
		"height": 1920,
		"metadata": "none"
	},
	{
		"name": "profile",
		"fit": "cover",
		"width": 1008,
		"height": 1008,
		"metadata": "none"
	},
	{
		"name": "thumb",
		"fit": "cover",
		"width": 160,
		"height": 160,
		"metadata": "none"
	},
	{
		"name": "icon",
		"fit": "cover",
		"width": 64,
		"height": 64,
		"metadata": "none"
	},
	{
		"name": "blur",
		"fit": "cover",
		"width": 64,
		"height": 64,
		"blur": 10,
		"metadata": "none"
	}
];

export default {
	async queue(batch, env) {
		for (const message of batch.messages) {
			const id = crypto.randomUUID();
			const blurId = crypto.randomUUID();
			const key = message.body.object.key;
			const url = `https://${message.body.bucket}.${env.BASE_URL}/${key}`;
			const head = await env.SOURCE_BUCKET.head(key);
			const type = head.httpMetadata.contentType;

			if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(type)) {
				console.log(`Message ${message.id}: skipping ${url} (${type})`);
				continue;
			}

			console.log(`Message ${message.id}: ${url} -> ${id} ${blurId} (${type})`);
			for (const option of variants) {
				const result = await fetch(`https://${env.BASE_URL}/cdn-cgi/image/fit=${option.fit},width=${option.width},height=${option.height}${option.blur ? `,blur=${option.blur}` : ""},quality=90,metadata=none/${url}`);
				const blob = await result.blob();
				await env.DESTINATION_BUCKET.put(`${option.name === "blur" ? blurId : id}/${option.name}`, blob);
			};

			await fetch(`https://api.${env.BASE_URL}/v1/images/variants`, {
				method: "post",
				headers: {
					authorization: `Bearer ${env.ACCESS_TOKEN}`,
					"content-type": "application/json"
				},
				body: JSON.stringify({
					original_file: key,
					external_id: id,
					blur_id: blurId
				})
			});
		}
	},
};
