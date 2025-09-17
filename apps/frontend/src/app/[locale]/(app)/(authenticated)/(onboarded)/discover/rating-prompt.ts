import { InAppReview } from "@capacitor-community/in-app-review";
import ms from "ms.macro";
import { useEffect } from "react";

import { User } from "~/api/user";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";

export function useRatingPrompt() {
	const { user: { id, ratingPrompts, createdAt } } = useSession();
	const { native } = useDevice();

	useEffect(() => {
		if (!native) return;

		const monthsRegistered = Math.floor(
			(Date.now() - new Date(createdAt!).getTime()) / ms("30d")
		);

		if (
			(monthsRegistered >= 1 && ratingPrompts === 0)
			|| (monthsRegistered >= 3 && ratingPrompts === 1)
			|| (monthsRegistered >= 6 && ratingPrompts === 2)
		) {
			void InAppReview.requestReview();
			void User.updateRatingPrompts(id, {
				ratingPrompts: monthsRegistered >= 6 ? 3 : monthsRegistered >= 3 ? 2 : 1
			});
		}
	}, [id, ratingPrompts, createdAt, native]);
}
