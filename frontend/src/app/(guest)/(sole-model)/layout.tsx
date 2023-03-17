import { SoleModelLayout } from "~/components/layout/sole-model";

export default async function GuestSoleModelLayout({ children }: React.PropsWithChildren) {
	return <SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>;
}
