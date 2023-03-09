import { SoleModelLayout } from "~/components/layout/sole-model";

export default function AuthenticatedEmailConfirmedSoleModelLayout({
	children
}: React.PropsWithChildren) {
	return <SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>;
}
