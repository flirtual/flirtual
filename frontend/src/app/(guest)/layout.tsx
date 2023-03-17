import { redirect } from "next/navigation";

import { useServerAuthenticate } from "~/server-utilities";
import { urls } from "~/urls";

export default async function GuestLayout({ children }: React.PropsWithChildren) {
	const session = await useServerAuthenticate({ optional: true });
	if (session) redirect(urls.browse());

	return children;
}
