import { SessionProvider } from "~/components/session-provider";

export default function DebuggerLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<SessionProvider tags={["debugger"]}>{children}</SessionProvider>
	);
}
