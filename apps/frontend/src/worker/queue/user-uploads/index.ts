import { processImage } from "./process-image";

export const queue: ExportedHandler<Env, {
	bucket: string;
	object: {
		key: string;
	};
}>["queue"] = async ({ messages }) => {
	await Promise.all(messages.map(async (message) => {
		try {
			await processImage(message.body.object.key);
			message.ack();
		}
		catch (reason) {
			console.error(reason);
			message.retry({ delaySeconds: Math.min(message.attempts ** 2, 900) });
		}
	}));
};
