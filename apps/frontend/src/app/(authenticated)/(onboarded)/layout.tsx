import { withOnboardedUser } from "~/server-utilities";

export default async function AuthenticatedOnboardedLayout({
	children
}: React.PropsWithChildren) {
	await withOnboardedUser();
	return <>{children}</>;
}
