import { notFound } from "next/navigation";

import { getSession } from "~/server-utilities";

import type { PropsWithChildren } from "react";

export default async function ({ children }: PropsWithChildren) {
	const { user } = await getSession();
	if (!user.tags?.includes("moderator")) notFound();

	return <>{children}</>;
}
