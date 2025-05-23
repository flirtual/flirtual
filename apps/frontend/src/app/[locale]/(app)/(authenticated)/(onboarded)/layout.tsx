"use client";

import { useLocale } from "next-intl";
import type { PropsWithChildren } from "react";

import { useSession } from "~/hooks/use-session";
import { redirect } from "~/i18n/navigation";
import { urls } from "~/urls";

export default function OnboardedLayout({ children }: PropsWithChildren) {
	const { user } = useSession();
	const locale = useLocale();

	if (user.status === "registered")
		return redirect({ href: urls.onboarding(1), locale });
	if (user.deactivatedAt)
		return redirect({ href: urls.settings.deactivateAccount, locale });

	return <>{children}</>;
}
