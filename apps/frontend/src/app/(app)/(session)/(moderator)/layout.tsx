import { notFound } from "next/navigation";

import type { PropsWithChildren } from "react";

import { Authentication } from "~/api/auth";

export default async function ({ children }: PropsWithChildren) {
	const { user } = await Authentication.getSession();
	if (!user.tags?.includes("moderator")) notFound();

	return <>{children}</>;
}
