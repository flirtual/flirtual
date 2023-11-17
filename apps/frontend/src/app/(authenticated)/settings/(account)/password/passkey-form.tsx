/* eslint-disable unicorn/prefer-code-point */
"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "~/api";
import { Button } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";
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

const AAGUID_DATABASE =
	"https://raw.githubusercontent.com/passkeydeveloper/passkey-authenticator-aaguids/main/combined_aaguid.json";

export const PasswordPasskeyForm: React.FC = () => {
	const [session] = useSession();
	const { native } = useDevice();
	const router = useRouter();
	const toasts = useToast();
	const [passkeysAvailable, setPasskeysAvailable] = useState(false);
	const [aaguidData, setAAGUIDData] = useState<AAGUIDData>({});

	useEffect(() => {
		if (
			session &&
			window.PublicKeyCredential &&
			PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
			PublicKeyCredential.isConditionalMediationAvailable
		) {
			void Promise.all([
				PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
				PublicKeyCredential.isConditionalMediationAvailable()
			]).then((results) => {
				return setPasskeysAvailable(results.every((r) => r === true));
			});
		} else {
			return;
		}
	});

	useEffect(() => {
		const fetchAAGUIDData = async () => {
			const response = await fetch(AAGUID_DATABASE);
			const data = (await response.json()) as AAGUIDData;
			setAAGUIDData(data);
		};

		if (session?.user.passkeys) void fetchAAGUIDData();
	}, [session?.user.passkeys]);

	if (!session) return null;

	return (
		<>
			<div className="flex flex-col gap-4">
				<span className="select-none text-2xl font-semibold">Passkeys</span>
				<span className="select-none text-black-50 dark:text-white-50">
					Passkeys let you log in conveniently and securely with your
					fingerprint, face, device PIN or security key instead of your
					password. Only add passkeys on trusted devices.
				</span>
				{native && (
					<span className="select-none text-black-50 dark:text-white-50">
						⚠️ Passkeys are not yet supported on mobile.
					</span>
				)}
			</div>
			{session.user.passkeys && session.user.passkeys.length > 0 && (
				<div className="flex flex-col gap-4">
					{session.user.passkeys.map((passkey) => (
						<PasskeyButton
							date={new Date(passkey.createdAt)}
							icon={aaguidData[passkey.aaguid]?.icon_light}
							id={passkey.id}
							key={passkey.id}
							name={aaguidData[passkey.aaguid]?.name}
						/>
					))}
					<span className="select-none text-black-50 dark:text-white-50">
						{native ? "Tap" : "Click"} on a passkey to remove it.
					</span>
				</div>
			)}

			<Button
				{...(!passkeysAvailable && { disabled: true })}
				Icon={Plus}
				type="button"
				onClick={async () => {
					const challenge = await api.auth.passkeyRegistrationChallenge({
						query: { platform: false }
					});

					const credential = (await navigator.credentials
						.create(challenge)
						.catch((reason) => {
							if (reason.name === "InvalidStateError") {
								toasts.add({
									type: "warning",
									value: "You've already added this passkey."
								});
							}
							return;
						})) as PublicKeyCredential;
					if (!credential) return;

					const response =
						credential.response as AuthenticatorAttestationResponse;

					await api.auth
						.createPasskey({
							body: {
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
							}
						})
						.then(() => {
							return router.refresh();
						});
				}}
			>
				Add passkey
				{!passkeysAvailable &&
					(native ? " (unsupported device)" : " (unsupported browser)")}
			</Button>
		</>
	);
};
