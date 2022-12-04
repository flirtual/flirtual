import { SoleModelLayout } from "~/components/layout/sole-model";
import { SsrUserProvider } from "~/components/ssr-user-provider";

export default function AuthenticatedLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<SsrUserProvider>
			<SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>
		</SsrUserProvider>
	);
}
