import { notFound } from "next/navigation";

import { Authentication } from "~/api/auth";

import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const { user } = await Authentication.getSession();
	if (!user.tags?.includes("admin")) notFound();

	return <>{children}</>;
}
