import { SoleModelLayout } from "~/components/layout/sole-model";
import { SsrUserProvider } from "~/components/ssr-user-provider";

import { Profile } from "./profile";

export interface ProfilePageProps {
	params: { userId: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	return (
		// @ts-expect-error: server component
		<SsrUserProvider>
			<SoleModelLayout footer={{ desktopOnly: true }}>
				<Profile userId={params.userId} />
			</SoleModelLayout>
		</SsrUserProvider>
	);
}
