// The app's own useQuery suspends, which would hold the whole shell behind a
// platform round-trip. Read the range without blocking and act once it lands.
import { useQuery } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { AgeRange } from "~/age-range";
import { isWretchError } from "~/api/common";
import { User } from "~/api/user";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";
import { ageRangeFetcher, ageRangeKey, queryClient } from "~/query";
import { urls } from "~/urls";

import { Button, ButtonLink } from "./button";
import { ModelCard } from "./model-card";

const unknownRange: AgeRange = { group: "unknown" };

function useReportAgeRange({ group, platform, declaration, ageLower, ageUpper }: AgeRange) {
	const session = useOptionalSession();
	const userId = session?.user.id;

	const underage = group === "child" || group === "teen";

	useEffect(() => {
		if (!underage || !userId) return;

		void User
			.reportAgeRange(userId, { platform, declaration, ageLower, ageUpper })
			.catch((reason) => {
				// The account was banned, so the session is gone. A child sees the
				// block gate, a teen goes to the underage ban page.
				if (isWretchError(reason) && reason.json?.error === "banned_underage") {
					if (group !== "child") window.location.href = urls.underage;
					return;
				}

				console.error(reason);
			});
	}, [underage, group, userId, platform, declaration, ageLower, ageUpper]);
}

function AgeCard({ children, title }: PropsWithChildren<{ title: string }>) {
	return (
		<div className="flex min-h-screen w-full grow flex-col items-center overflow-x-clip desktop:flex-col desktop:p-8">
			<ModelCard branded miniFooter title={title}>
				{children}
			</ModelCard>
		</div>
	);
}

function AgeBlocked() {
	const { t } = useTranslation();

	return (
		<AgeCard title={t("age_blocked_title")}>
			<p>{t("age_blocked_description")}</p>
		</AgeCard>
	);
}

// The platform reports an age obligation but the user has not shared their age.
// We must direct them to resolve in Google Play or share in Apple Settings.
function AgeUnresolved() {
	const { t } = useTranslation();
	const { apple } = useDevice();
	const [pending, setPending] = useState(false);

	return (
		<AgeCard title={t("age_unresolved_title")}>
			<div className="flex flex-col gap-6">
				<p>{t(apple ? "age_unresolved_apple" : "age_unresolved_google")}</p>
				<div className="flex flex-col gap-4">
					{/* Apple Settings isn't linkable. */}
					{!apple && (
						<ButtonLink href="https://play.google.com/store" kind="secondary">
							{t("open_google_play")}
						</ButtonLink>
					)}
					<Button
						pending={pending}
						onClick={async () => {
							setPending(true);
							await queryClient.refetchQueries({ queryKey: ageRangeKey() });
							setPending(false);
						}}
					>
						{t("try_again")}
					</Button>
				</div>
			</div>
		</AgeCard>
	);
}

export function AgeGate({ children }: PropsWithChildren) {
	const { data: range = unknownRange } = useQuery({
		queryKey: ageRangeKey(),
		queryFn: ageRangeFetcher,
		staleTime: Number.POSITIVE_INFINITY
	}, queryClient);

	useReportAgeRange(range);

	if (range.group === "child") return <AgeBlocked />;
	if (range.group === "unresolved") return <AgeUnresolved />;

	return children;
}
