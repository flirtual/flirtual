import { SoleModelLayout } from "~/components/layout/sole-model";
import { SsrUserProvider } from "~/components/ssr-user-provider";

import { Profile } from "./profile";

export default async function ProfilePage() {
	return (
		// @ts-expect-error: server component
		<SsrUserProvider>
			<SoleModelLayout footer={{ desktopOnly: true }}>
				<Profile />
			</SoleModelLayout>
		</SsrUserProvider>
	);
}
