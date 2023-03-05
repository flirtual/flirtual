import useSWR from "swr";

import { api } from "~/api";
import { DefaultProfilePersonality } from "~/api/user/profile";

import { useSessionUser } from "./use-session";

export function useSessionPersonality() {
	const user = useSessionUser();

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
