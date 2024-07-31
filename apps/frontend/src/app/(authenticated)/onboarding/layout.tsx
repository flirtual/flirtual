import { SoleModelLayout } from "~/components/layout/sole-model";
import { FlirtualLogo } from "~/components/logo";

export default function OnboardingLayout({
	children
}: React.PropsWithChildren) {
	return (
		<SoleModelLayout footer={{ desktopOnly: true }} navigation={false}>
			<FlirtualLogo className="mb-8 hidden h-20 desktop:flex" />
			{children}
		</SoleModelLayout>
	);
}
