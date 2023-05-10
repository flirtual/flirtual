import { Metadata } from "next";

import { ConversationChatbox } from "~/hooks/use-talkjs";
import { displayName } from "~/api/user";

import { ConversationAside } from "../aside";
import { getProfileUser } from "../../(sole-model)/[username]/profile-user";

export interface ConversationPageProps {
	params: {
		userId: string;
	};
}

export async function generateMetadata({ params }: ConversationPageProps): Promise<Metadata> {
	const user = await getProfileUser(params.userId);

	return {
		title: displayName(user)
	};
}

export default async function ConversationPage(props: ConversationPageProps) {
	const {
		params: { userId }
	} = props;

	return (
		<>
			<ConversationAside activeConversation={userId} />
			<div className="flex h-full w-full flex-col items-center justify-center md:pl-8">
				<ConversationChatbox
					className="h-[calc(100vh-8rem)] w-full overflow-hidden shadow-brand-1 md:h-[32rem] md:rounded-xl"
					userId={userId}
				/>
			</div>
		</>
	);
}
