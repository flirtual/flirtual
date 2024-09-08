import { getSession } from "~/api/auth";

export default async function MinimalSessionLayout({
	children
}: React.PropsWithChildren) {
	await getSession();
	return <>{children}</>;
}
