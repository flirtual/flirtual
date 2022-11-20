import { SoleModelLayout } from "~/components/layout/sole-model";
import { useServerAuthenticate } from "~/server-utilities";

import { Profile } from "./profile";

export default async function ProfilePage() {
	await useServerAuthenticate();

	return (
		<SoleModelLayout footer={{ desktopOnly: true }}>
			<Profile />
		</SoleModelLayout>
	);
}
