import { SessionProvider } from "~/components/session-provider";

export const dynamic = "force-dynamic";

export default function AuthenticatedLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<SessionProvider emailConfirmedOptional visibleOptional>
			{children}
		</SessionProvider>
	);
}
