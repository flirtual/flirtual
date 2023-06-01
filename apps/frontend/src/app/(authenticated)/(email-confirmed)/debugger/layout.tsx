import { withTaggedUser } from "~/server-utilities";

export default async function DebuggerLayout({ children }: React.PropsWithChildren) {
	await withTaggedUser("debugger");
	return <>{children}</>;
}
