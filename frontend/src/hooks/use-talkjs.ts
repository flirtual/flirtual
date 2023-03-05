import { useEffect, useMemo, useState } from "react";
import Talk from "talkjs";

import { User } from "~/api/user";
import { talkjsAppId } from "~/const";
import { urls } from "~/urls";

import { useSession } from "./use-session";

function createUser(user: User): Talk.User {
	return new Talk.User({
		id: user.id,
		name: user.profile.displayName ?? user.username,
		email: user.email,
		photoUrl: urls.userAvatar(user),
		role: "default"
	});
}

export function useTalkjs() {
	const [ready, setReady] = useState(false);
	const [authSession] = useSession();

	const { user, session } = useMemo(() => {
		if (!authSession) return { user: null, session: null };
		const user = createUser(authSession.user);

		return {
			user,
			session: new Talk.Session({
				appId: talkjsAppId,
				me: user
			})
		};
	}, [authSession]);

	useEffect(() => void Talk.ready.then(() => setReady(true)), []);

	useEffect(() => {
		return () => session?.destroy();
	}, [ready, session]);

	return {
		ready,
		user,
		session
	};
}

export function useConversation(otherUser: User) {
	const { user, session } = useTalkjs();

	const { targetUser, conversation } = useMemo(() => {
		if (!user || !session) return { targetUser: null, conversation: null };

		const targetUser = createUser(otherUser);

		const conversationId = Talk.oneOnOneId(user, targetUser);
		const conversation = session.getOrCreateConversation(conversationId);

		conversation.setParticipant(user);
		conversation.setParticipant(targetUser);

		return { targetUser, conversation };
	}, [user, session, otherUser]);

	console.log({ user, targetUser, conversation });
}
