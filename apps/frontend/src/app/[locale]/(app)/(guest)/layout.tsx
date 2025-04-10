import { Authentication } from "~/api/auth";

export default async function GuestLayout({
	children
}: React.PropsWithChildren) {
	await Authentication.assertGuest();
	return <>{children}</>;
}
