import { Authentication } from "~/api/auth";

import type { PropsWithChildren } from "react";

export default async function OnboardedLayout({ children }: PropsWithChildren) {
	await Authentication.getOnboardedSession();
	return <>{children}</>;
}
