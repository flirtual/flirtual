import { SessionProvider } from "~/components/session-provider";

export default function AuthenticatedEmailConfirmedLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<SessionProvider>{children}</SessionProvider>
	);
}
