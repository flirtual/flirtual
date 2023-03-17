"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { api } from "~/api";
import { urls } from "~/urls";
import { useSession } from "~/hooks/use-session";

export default function LogoutPage() {
	const [, mutateSession] = useSession();
	const router = useRouter();

	useEffect(() => {
		void (async () => {
			await api.auth.logout().catch(() => null);
			await mutateSession();

			router.push(urls.login());
		});
	});

	return null;
}
