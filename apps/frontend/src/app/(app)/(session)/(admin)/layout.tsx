import { notFound } from "next/navigation";

import { getSession } from "~/api/auth";

import type { PropsWithChildren } from "react";

export default async function ({ children }: PropsWithChildren) {
	const { user } = await getSession();
	if (!user.tags?.includes("admin")) notFound();

	return <>{children}</>;
}
