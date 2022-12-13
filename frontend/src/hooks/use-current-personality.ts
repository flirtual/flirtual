import useSWR from "swr";

import { api } from "~/api";
import { DefaultProfilePersonality } from "~/api/user/profile";

import { useCurrentUser } from "./use-current-user";

export function useCurrentPersonality() {
	const { data: user } = useCurrentUser();

	const { data: personality } = useSWR(
		"personality",
		() => {
			if (!user) return DefaultProfilePersonality;
			return api.user.profile.getPersonality(user.id);
		},
		{
			fallbackData: DefaultProfilePersonality
		}
	);

	return personality ?? DefaultProfilePersonality;
}
