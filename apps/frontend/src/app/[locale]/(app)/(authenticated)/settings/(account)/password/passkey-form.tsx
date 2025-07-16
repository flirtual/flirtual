import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Authentication } from "~/api/auth";
import { Button } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey, useMutation, useQuery } from "~/query";

import { PasskeyButton } from "./passkey-button";

interface AAGUUIDInfo {
	name: string;
	icon_dark: string;
	icon_light: string;
}

interface AAGUIDData {
	[key: string]: AAGUUIDInfo;
}

function useAaguid() {
	return useQuery({
		queryKey: ["aaguid"],
		queryFn: async () => {
			const response = await fetch("https://raw.githubusercontent.com/passkeydeveloper/passkey-authenticator-aaguids/main/combined_aaguid.json");
			return (await response.json()) as AAGUIDData;
		},
		placeholderData: {} as AAGUIDData
	});
}

export const PasswordPasskeyForm: React.FC = () => {
	const session = useSession();
	const { native } = useDevice();
	const toasts = useToast();
	const { t } = useTranslation();

	const [passkeysAvailable, setPasskeysAvailable] = useState(false);
	const aaguidData = useAaguid();

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

	const { mutate, isPending } = useMutation({
		mutationKey: sessionKey(),
		mutationFn: async () => {
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
				});

			await invalidate({ queryKey: sessionKey() });
		},
		onError: toasts.addError
	});

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
				pending={isPending}
				type="button"
				onClick={() => mutate()}
			>
				{t("add_passkey")}
				{" "}
				{!passkeysAvailable
				&& (native ? t("unsupported_device") : t("unsupported_browser"))}
			</Button>
		</>
	);
};
