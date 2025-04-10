import { Authentication } from "~/api/auth";

export default async function MinimalGuestLayout({
	children
}: React.PropsWithChildren) {
	await Authentication.assertGuest();
	return <>{children}</>;
}
