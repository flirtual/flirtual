import { assertGuest } from "~/api/auth";

export default async function MinimalGuestLayout({
	children
}: React.PropsWithChildren) {
	await assertGuest();
	return <>{children}</>;
}
