/* eslint-disable unicorn/prefer-code-point */
import { DatedModel } from "./common";
import { User } from "./user";
import { fetch, NarrowFetchOptions } from "./exports";

export type Session = DatedModel & {
	sudoerId?: string;
	user: User;
};

export async function login(
	options: NarrowFetchOptions<{
		login: string;
		password: string;
		rememberMe: boolean;
	}>
) {
	return fetch<Session>("post", "auth/session", options);
}

export async function logout(options: NarrowFetchOptions = {}) {
	return fetch("delete", "auth/session", { ...options, raw: true });
}

export async function sudo(options: NarrowFetchOptions<{ userId: string }>) {
	return fetch<Session>("post", "auth/sudo", options);
}

export async function revokeSudo(options: NarrowFetchOptions = {}) {
	return fetch<Session>("delete", "auth/sudo", options);
}

export async function session(options: NarrowFetchOptions = {}) {
	return fetch<Session>("get", "auth/session", options);
}

export async function user(options: NarrowFetchOptions = {}) {
	return fetch<User>("get", "auth/user", options);
}

export async function sso(signer: string, options: NarrowFetchOptions = {}) {
	return fetch<{ token: string }>("get", `auth/sso/${signer}`, options);
}

export async function resetPassword(
	options: NarrowFetchOptions<{ email: string }>
) {
	await fetch("delete", "auth/password", options);
}

export interface ConfirmResetPassword {
	email: string;
	password: string;
	passwordConfirmation: string;
	token: string;
}

export async function confirmResetPassword(
	options: NarrowFetchOptions<ConfirmResetPassword>
) {
	await fetch("post", "auth/password/reset", options);
}

interface PublicKeyCredentialCreationOptionsBase64
	extends Omit<
		PublicKeyCredentialCreationOptions,
		"challenge" | "user" | "excludeCredentials"
	> {
	challenge: string;
	user: PublicKeyCredentialUserEntityBase64;
	excludeCredentials: Array<PublicKeyCredentialDescriptorBase64>;
}

interface PublicKeyCredentialRequestOptionsBase64
	extends Omit<PublicKeyCredentialRequestOptions, "challenge"> {
	challenge: string;
}

interface PublicKeyCredentialUserEntityBase64
	extends Omit<PublicKeyCredentialUserEntity, "id"> {
	id: string;
}

interface PublicKeyCredentialDescriptorBase64
	extends Omit<PublicKeyCredentialDescriptor, "id"> {
	id: string;
}

const convertBase64ToArrayBuffer = (base64String: string): ArrayBuffer => {
	return Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0)).buffer;
};

const convertPublicKey = (
	publicKey: PublicKeyCredentialCreationOptionsBase64
): CredentialCreationOptions => {
	const { challenge, user, excludeCredentials, ...options } = publicKey;
	return {
		publicKey: {
			...options,
			challenge: convertBase64ToArrayBuffer(challenge),
			user: {
				...user,
				id: convertBase64ToArrayBuffer(user.id)
			},
			excludeCredentials: excludeCredentials.map((credential) => ({
				...credential,
				id: convertBase64ToArrayBuffer(credential.id)
			}))
		}
	};
};

export async function passkeyRegistrationChallenge(
	options: NarrowFetchOptions<undefined, { platform?: boolean }>
): Promise<CredentialCreationOptions> {
	return fetch<{ publicKey: PublicKeyCredentialCreationOptionsBase64 }>(
		"get",
		"auth/passkey/registration-challenge",
		options
	).then((response) => {
		return convertPublicKey(response.publicKey);
	});
}

export async function passkeyAuthenticationChallenge(
	options: NarrowFetchOptions = {}
) {
	return fetch<{ publicKey: PublicKeyCredentialRequestOptionsBase64 }>(
		"get",
		"auth/passkey/authentication-challenge",
		options
	).then((response) => {
		return {
			publicKey: {
				...response.publicKey,
				challenge: convertBase64ToArrayBuffer(response.publicKey.challenge)
			}
		};
	});
}

export interface CreatePasskey {
	rawId: string;
	response: {
		attestationObject: string;
		clientDataJSON: string;
	};
}

export async function createPasskey(
	options: NarrowFetchOptions<CreatePasskey>
) {
	return fetch("post", "auth/passkey", options);
}

export async function deletePasskey(
	options: NarrowFetchOptions<undefined, { passkeyId: string }>
) {
	return fetch("delete", "auth/passkey", options);
}

export async function authenticatePasskey(
	options: NarrowFetchOptions<{
		credentialId: string;
		rawId: string;
		response: {
			authenticatorData: string;
			clientDataJSON: string;
			signature: string;
		};
	}>
) {
	return fetch("post", "auth/passkey/authenticate", options);
}
