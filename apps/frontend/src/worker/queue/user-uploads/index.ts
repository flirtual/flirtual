import { processImage } from "./process-image";

export const queue: ExportedHandler<Env, {
	bucket: string;
	object: {
		key: string;
	};
}>["queue"] = async ({ messages }) => {
	await Promise.all(messages.map(async (message) => {
		const { body, attempts } = message;

		try {
			await processImage(body.object.key);
			message.ack();
		}
		catch (reason) {
			console.error(reason);
			message.retry({ delaySeconds: Math.min(attempts ** 2, 900) });
		}
	}));
};
