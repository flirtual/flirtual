import { ModeratorMessageModal } from "~/components/modals/moderator-message";
import { TalkjsProvider } from "~/hooks/use-talkjs";
import { withSession } from "~/server-utilities";

export default async function AuthenticatedLayout({
	children
}: React.PropsWithChildren) {
	const session = await withSession();

	return (
		<TalkjsProvider>
			{children}
			{session?.user.moderatorMessage && <ModeratorMessageModal />}
		</TalkjsProvider>
	);
}
