import { SessionProvider } from "~/components/session-provider";
import { TalkjsProvider } from "~/hooks/use-talkjs";

export const dynamic = "force-dynamic";

export default function AuthenticatedLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<SessionProvider emailConfirmedOptional visibleOptional>
			<TalkjsProvider>{children}</TalkjsProvider>
		</SessionProvider>
	);
}
