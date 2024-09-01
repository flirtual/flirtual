import { assertGuest } from "~/server-utilities";

export default async function MinimalGuestLayout({
	children
}: React.PropsWithChildren) {
	await assertGuest();
	return <>{children}</>;
}
