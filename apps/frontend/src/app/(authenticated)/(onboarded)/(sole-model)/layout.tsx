import { SoleModelLayout } from "~/components/layout/sole-model";

export default function AuthenticatedOnboardedSoleModelLayout({
	children
}: React.PropsWithChildren) {
	return (
		<SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>
	);
}
