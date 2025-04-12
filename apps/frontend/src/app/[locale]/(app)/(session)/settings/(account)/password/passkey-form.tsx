"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import { useEffect, useState } from "react";
import { useSWR } from "~/swr";

import { Authentication } from "~/api/auth";
import { Button } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

import { PasskeyButton } from "./passkey-button";

interface AAGUUIDInfo {
	name: string;
	icon_dark: string;
	icon_light: string;
}

interface AAGUIDData {
	[key: string]: AAGUUIDInfo;
}

const AAGUID_DATABASE
	= "https://raw.githubusercontent.com/passkeydeveloper/passkey-authenticator-aaguids/main/combined_aaguid.json";

export const PasswordPasskeyForm: React.FC = () => {
	const session = useOptionalSession();
	const { native } = useDevice();
	const router = useRouter();
	const toasts = useToast();
	const t = useTranslations();

	const [passkeysAvailable, setPasskeysAvailable] = useState(false);
	const { data: aaguidData = {} } = useSWR("aaguid", async () => {
		const response = await fetch(AAGUID_DATABASE);
		const data = (await response.json()) as AAGUIDData;
		return data;
	});

	useEffect(() => {
		if (
			session
			&& window.PublicKeyCredential
			&& PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
			&& PublicKeyCredential.isConditionalMediationAvailable
		) {
			void Promise.all([
				PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
				PublicKeyCredential.isConditionalMediationAvailable()
			]).then((results) => {
				return setPasskeysAvailable(results.every((r) => r === true));
			});
		}
	}, [session]);

	if (!session) return null;

	return (
		<>
			<div className="flex flex-col gap-4">
				<span className="text-2xl font-semibold">{t("passkeys")}</span>
				<span className="text-black-50 vision:text-white-50 dark:text-white-50">
					{t("broad_upper_ox_drum")}
				</span>
				{native && (
					<span className="text-black-50 dark:text-white-50">
						⚠️
						{" "}
						{t("large_simple_penguin_learn")}
					</span>
				)}
			</div>
			{session.user.passkeys && session.user.passkeys.length > 0 && (
				<div className="flex flex-col gap-4">
					{session.user.passkeys.map((passkey) => (
						<PasskeyButton
							date={new Date(passkey.createdAt)}
							icon={aaguidData[passkey.aaguid]?.icon_dark}
							id={passkey.id}
							key={passkey.id}
							name={aaguidData[passkey.aaguid]?.name}
						/>
					))}
				</div>
			)}

			<Button
				{...(!passkeysAvailable && { disabled: true })}
				Icon={Plus}
				type="button"
				onClick={async () => {
					const challenge
						= await Authentication.passkey.registrationChallenge(false);

					const credential = (await navigator.credentials
						.create(challenge)
						.catch((reason) => {
							if (reason instanceof Error && reason.name === "InvalidStateError") {
								toasts.add({
									type: "warning",
									value: t("level_nice_cheetah_drum")
								});
							}
						})) as PublicKeyCredential;
					if (!credential) return;

					const response
						= credential.response as AuthenticatorAttestationResponse;

					await Authentication.passkey
						.create({
							rawId: btoa(
								String.fromCharCode(...new Uint8Array(credential.rawId))
							),
							response: {
								attestationObject: btoa(
									String.fromCharCode(
										...new Uint8Array(response.attestationObject)
									)
								),
								clientDataJSON: btoa(
									String.fromCharCode(
										...new Uint8Array(response.clientDataJSON)
									)
								)
							}
						})
						.then(() => {
							return router.refresh();
						});
				}}
			>
				{t("add_passkey")}
				{" "}
				{!passkeysAvailable
				&& (native ? t("unsupported_device") : t("unsupported_browser"))}
			</Button>
		</>
	);
};
