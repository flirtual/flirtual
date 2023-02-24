import { AuthProvider } from "~/components/auth-provider";
import { SoleModelLayout } from "~/components/layout/sole-model";

export default function AuthenticatedSoleModelLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<AuthProvider emailConfirmedOptional visibleOptional>
			<SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>
		</AuthProvider>
	);
}
