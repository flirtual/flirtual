import { SessionProvider } from "~/components/session-provider";

export const dynamic = "force-dynamic";

export default function ModeratorLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<SessionProvider tags={["moderator"]}>{children}</SessionProvider>
	);
}
