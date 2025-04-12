"use client";

import { useLocale } from "next-intl";
import type { PropsWithChildren } from "react";

import { useOptionalSession } from "~/hooks/use-session";
import { withSuspense } from "~/hooks/with-suspense";
import { redirect } from "~/i18n/navigation";
import { urls } from "~/urls";

const AssertGuest = withSuspense(() => {
	const [session] = useOptionalSession();
	const locale = useLocale();

	// If the user is logged in, redirect them to the browse page.
	if (session) redirect({ href: urls.browse(), locale });

	return null;
});

export default function MinimalGuestLayout({ children }: PropsWithChildren) {
	return (
		<>
			<AssertGuest />
			<>
				{children}
			</>
		</>
	);
}
