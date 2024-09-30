import { notFound } from "next/navigation";

import { Authentication } from "~/api/auth";

import type { PropsWithChildren } from "react";

export default async function ModeratorLayout({ children }: PropsWithChildren) {
	const { user } = await Authentication.getSession();
	if (!user.tags?.includes("moderator")) notFound();

	return <>{children}</>;
}
