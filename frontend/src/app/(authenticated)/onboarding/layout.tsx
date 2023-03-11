import { SoleModelLayout } from "~/components/layout/sole-model";
import { SessionProvider } from "~/components/session-provider";

export default function OnboardingLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<SessionProvider emailConfirmedOptional visibleOptional>
			<SoleModelLayout footer={{ desktopOnly: true }} mobileNavigation={false}>
				{children}
			</SoleModelLayout>
		</SessionProvider>
	);
}
