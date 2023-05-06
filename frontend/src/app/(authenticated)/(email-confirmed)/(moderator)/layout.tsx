import { withTaggedUser } from "~/server-utilities";

export default async function ModeratorLayout({ children }: React.PropsWithChildren) {
	await withTaggedUser("moderator");
	return <>{children}</>;
}
