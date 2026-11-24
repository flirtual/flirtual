import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";

import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { useGuest } from "~/hooks/use-session";
import { hideNativeNavigation } from "~/native-navigation";
import LogoBackground from "~/static/logo-background.svg";
import { urls } from "~/urls";

const legalLinkClassName = "font-semibold text-white-10 underline";

export default function WelcomePage() {
	const { t } = useTranslation();
	useGuest();

	useEffect(() => {
		hideNativeNavigation({ edgeToEdge: true });
		return () => hideNativeNavigation();
	}, []);

	return (
		<main className="flex min-h-screen flex-col items-center bg-brand-gradient px-6 pt-(--safe-area-inset-top,0px) pb-[max(var(--safe-area-inset-bottom,0px),1.5rem)] text-white-10">
			<div className="flex w-full max-w-sm grow flex-col items-center justify-center gap-4">
				<img alt={t("flirtual_logo")} className="w-56" src={LogoBackground} />
				<h1 className="text-center font-montserrat text-2xl font-semibold text-balance">
					{t("landing_title")}
				</h1>
			</div>
			<div className="flex w-full max-w-sm flex-col items-center gap-4">
				<p className="text-center text-sm text-balance">
					<Trans
						components={{
							terms: <InlineLink className={legalLinkClassName} highlight={false} href={urls.resources.termsOfService} />,
							privacy: <InlineLink className={legalLinkClassName} highlight={false} href={urls.resources.privacyPolicy} />
						}}
						i18nKey="welcome_agreement"
						values={{ create_account: t("create_account"), log_in: t("log_in") }}
					/>
				</p>
				<ButtonLink className="w-full rounded-full bg-white-10" href={urls.registerAgreed} kind="secondary">
					{t("create_account")}
				</ButtonLink>
				<ButtonLink className="w-full font-semibold text-white-10" href={urls.login()} kind="tertiary">
					{t("log_in")}
				</ButtonLink>
			</div>
		</main>
	);
}
