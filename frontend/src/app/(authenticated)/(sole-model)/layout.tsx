import { SoleModelLayout } from "~/components/layout/sole-model";
import { SessionProvider } from "~/components/session-provider";

export default function AuthenticatedSoleModelLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<SessionProvider emailConfirmedOptional visibleOptional>
			<SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>
		</SessionProvider>
	);
}
