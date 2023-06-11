import { SoleModelLayout } from "~/components/layout/sole-model";

export default function OnboardingLayout({
	children
}: React.PropsWithChildren) {
	return (
		<SoleModelLayout footer={{ desktopOnly: true }} mobileNavigation={false}>
			{children}
		</SoleModelLayout>
	);
}
