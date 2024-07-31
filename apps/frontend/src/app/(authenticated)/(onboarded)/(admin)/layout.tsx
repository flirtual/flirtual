import { withTaggedUser } from "~/server-utilities";

export default async function AdminLayout({
	children
}: React.PropsWithChildren) {
	await withTaggedUser("admin");
	return <>{children}</>;
}
