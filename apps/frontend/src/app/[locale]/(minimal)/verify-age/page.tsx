import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import type { AgeVerificationMethods } from "~/api/age-verification";
import { AgeVerification } from "~/api/age-verification";
import { Button, ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { i18n, useLocale } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";
import { ageVerificationFetcher, ageVerificationKey, invalidate, queryClient, sessionKey } from "~/query";
import { throwRedirect } from "~/redirect";
import { urls } from "~/urls";

import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("verify_age_title") }) }
	]);
};

export default function VerifyAgePage() {
	const { t } = useTranslation();
	const [locale] = useLocale();
	const { native } = useDevice();
	const { addError } = useToast();

	const session = useOptionalSession();
	const [pending, setPending] = useState<AgeVerificationMethods | null>(null);

	const start = useCallback(async (methods: AgeVerificationMethods) => {
		setPending(methods);

		try {
			const { url } = await AgeVerification.create(locale, methods);

			if (native) window.open(url, "_blank");
			else window.location.href = url;
		}
		catch (reason) {
			await addError(reason);
		}

		setPending(null);
	}, [locale, native, addError]);

	const { data: state } = useQuery({
		queryKey: ageVerificationKey(),
		queryFn: ageVerificationFetcher,
		refetchInterval: ({ state: { data } }) =>
			data && data.required && data.verification?.status !== "fail"
				? 5000
				: false
	}, queryClient);

	const status = state?.verification?.status;

	const required = state ? state.required : !!session?.user.ban?.verificationRequired;
	const verified = status === "complete";

	useEffect(() => {
		if (!verified) return;
		void invalidate({ queryKey: sessionKey() });
	}, [verified]);

	if (!session) throwRedirect(urls.login(urls.verifyAge));

	if (!required && !state) return null;

	if (!required && !verified)
		throwRedirect(session.user.ban
			? urls.banned
			: session.user.status === "registered"
				? urls.onboarding(1)
				: urls.discover("dates"));

	if (!required && verified) {
		return (
			<ModelCard branded miniFooter title={t("verify_age_verified_title")}>
				<div className="flex flex-col gap-6">
					<p>{t("verify_age_verified_description")}</p>
					<ButtonLink href={urls.default}>{t("continue")}</ButtonLink>
				</div>
			</ModelCard>
		);
	}

	return (
		<ModelCard branded miniFooter title={t("verify_age_title")}>
			<div className="flex flex-col gap-6">
				<p>{t("verify_age_description")}</p>
				<p>
					<Trans
						components={{ yotiPrivacyLink: <InlineLink href={urls.resources.yotiPrivacy} /> }}
						i18nKey="verify_age_privacy"
					/>
				</p>
				{(status === "fail" || status === "error") && (
					<div className="flex gap-2 font-nunito text-lg text-red-600 dark:text-red-400">
						<AlertCircle className="mt-0.5 size-6 shrink-0" />
						<span>
							{t(status === "fail" ? "verify_age_failed" : "verify_age_errored")}
						</span>
					</div>
				)}
				<div className="flex flex-col gap-4">
					<Button
						disabled={!!pending}
						pending={pending === "recommended"}
						onClick={() => void start("recommended")}
					>
						{t("verify_age_start")}
					</Button>
					<Button
						disabled={!!pending}
						kind="secondary"
						pending={pending === "alternative"}
						onClick={() => void start("alternative")}
					>
						{t("verify_age_more_options")}
					</Button>
				</div>
			</div>
		</ModelCard>
	);
}
