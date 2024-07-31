import { SoleModelLayout } from "~/components/layout/sole-model";

export default function FinishLayout({ children }: React.PropsWithChildren) {
	return (
		<SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>
	);
}
