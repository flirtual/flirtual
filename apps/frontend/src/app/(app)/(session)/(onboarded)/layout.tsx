import { getOnboardedUser } from "~/server-utilities";

import type { PropsWithChildren } from "react";

export default async function OnboardedLayout({ children }: PropsWithChildren) {
	await getOnboardedUser();
	return <>{children}</>;
}
