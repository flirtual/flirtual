// import { Authentication } from "~/api/auth";
// import { Profile } from "~/components/profile/profile";

import type { PropsWithChildren } from "react";

export default async function ProfileSettingsLayout({
	children
}: PropsWithChildren) {
	// const { user } = await Authentication.getSession();

	return (
		<div className="flex gap-8">
			{children}
			{/* <div className="sticky top-0 hidden h-fit wide:flex">
				<Profile user={user} />
			</div> */}
		</div>
	);
}
