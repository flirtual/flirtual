import { ConversationChatbox } from "~/hooks/use-talkjs";

export interface ConversationPageProps {
	params: { userId: string };
}

export default function ConversationPage({ params: { userId } }: ConversationPageProps) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center md:pl-8">
			<ConversationChatbox
				className="h-[calc(100vh_-_8rem)] w-full overflow-hidden shadow-brand-1 md:h-[32rem] md:rounded-xl"
				userId={userId}
				options={{
					theme: "next-mobile"
				}}
			/>
		</div>
	);
}
