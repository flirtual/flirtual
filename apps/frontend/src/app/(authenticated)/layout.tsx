import { TalkjsProvider } from "~/hooks/use-talkjs";
import { withSession } from "~/server-utilities";

export default async function AuthenticatedLayout({ children }: React.PropsWithChildren) {
	await withSession();

	return <TalkjsProvider>{children}</TalkjsProvider>;
}
