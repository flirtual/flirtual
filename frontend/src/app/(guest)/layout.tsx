import { redirect } from "next/navigation";

import { withOptionalSession } from "~/server-utilities";
import { urls } from "~/urls";

export default async function GuestLayout({ children }: React.PropsWithChildren) {
	const session = await withOptionalSession();
	if (session) redirect(urls.browse());

	return <>{children}</>;
}
