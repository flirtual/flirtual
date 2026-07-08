import { startModel } from "./classifiers";
import { startServer } from "./server";
import { log } from "./log";

["SIGTERM", "SIGINT"].map((signal) =>
	// Gracefully exit on signals.
	process.once(signal, () => {
		process.exit(0);
	})
);

startServer();

void startModel().catch((reason) => {
	log.error(
		{ reason: reason instanceof Error ? reason.message : String(reason) },
		"Failed to load model."
	);
	process.exit(1);
});
