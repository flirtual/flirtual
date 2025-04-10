import type { PropsWithChildren } from "react";

import { Authentication } from "~/api/auth";

export default async function OnboardedLayout({ children }: PropsWithChildren) {
	await Authentication.getOnboardedSession();
	return <>{children}</>;
}
