import useSWR from "swr";

import { api } from "~/api";
import { DefaultProfilePersonality } from "~/api/user/profile";

import { useSessionUser } from "./use-session";

export function useSessionPersonality() {
	const user = useSessionUser();

	const { data: personality = DefaultProfilePersonality } = useSWR(
		["personality", user?.id],
		([, userId]) => {
			if (!userId) return null;
			return api.user.profile.getPersonality(userId);
		},
		{
			fallbackData: DefaultProfilePersonality
		}
	);

	console.log(user?.id, personality);
	return personality;
}
