import { Authentication } from "~/api/auth";

export default async function MinimalSessionLayout({
	children
}: React.PropsWithChildren) {
	await Authentication.getSession();
	return <>{children}</>;
}
