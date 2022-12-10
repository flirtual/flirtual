import { redirect } from "next/navigation";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { useServerAuthenticate } from "~/server-utilities";
import { urls } from "~/urls";

export default async function GuestLayout({ children }: React.PropsWithChildren) {
	const user = await useServerAuthenticate({ optional: true });
	if (user) redirect(urls.user(user.username));

	return <SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>;
}
