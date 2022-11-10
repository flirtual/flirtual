import { SoleModelLayout } from "~/components/layout/sole-model";
import { useServerAuthenticate } from "~/server-utilities";

export default async function ProfilePage() {
	const user = await useServerAuthenticate();

	return (
		<SoleModelLayout>
			<div>
				<div>
					<span>{user.profile.displayName ?? user.username}</span>
				</div>
			</div>
		</SoleModelLayout>
	);
}
