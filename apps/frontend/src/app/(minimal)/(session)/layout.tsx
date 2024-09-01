import { getSession } from "~/server-utilities";

export default async function MinimalSessionLayout({
	children
}: React.PropsWithChildren) {
	await getSession();
	return <>{children}</>;
}
