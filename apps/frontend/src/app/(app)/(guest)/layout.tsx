import { assertGuest } from "~/server-utilities";

export default async function GuestLayout({
	children
}: React.PropsWithChildren) {
	await assertGuest();
	return <>{children}</>;
}
