import type { ErrorProps } from "./error-dialog";
import { ErrorDialog } from "./error-dialog";
import { LoadingIndicator } from "./loading-indicator";

export default function AppError(props: ErrorProps) {
	return (
		<>
			<LoadingIndicator className="absolute inset-0 h-screen" />
			<ErrorDialog {...props} />
		</>
	);
}
