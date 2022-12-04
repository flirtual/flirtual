import { redirect } from "next/navigation";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { urls } from "~/pageUrls";
import { useServerAuthenticate } from "~/server-utilities";

export default async function GuestLayout({ children }: React.PropsWithChildren) {
	const user = await useServerAuthenticate({ optional: true });
	if (user) redirect(urls.user(user.username));

	return <SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>;
}
