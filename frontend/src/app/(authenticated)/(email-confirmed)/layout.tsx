import { withVisibleUser } from "~/server-utilities";

export default async function AuthenticatedEmailConfirmedLayout({
	children
}: React.PropsWithChildren) {
	await withVisibleUser();
	return <>{children}</>;
}
