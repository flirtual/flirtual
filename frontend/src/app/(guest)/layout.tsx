import { redirect } from "next/navigation";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { useServerAuthenticate } from "~/server-utilities";

export default async function GuestLayout({ children }: React.PropsWithChildren) {
	const user = await useServerAuthenticate({ optional: true });
	if (user) redirect(`/${user.id}`);

	return <SoleModelLayout footer={{ desktopOnly: true }}>{children}</SoleModelLayout>;
}
