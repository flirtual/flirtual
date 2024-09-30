import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "./user";

import { urls } from "~/urls";

import { api, type Issue, type DatedModel, isWretchError } from "./common";


export type Session = DatedModel & {
	sudoerId?: string;
	user: User;
};

export interface LoginOptions {
	login: string;
	password: string;
	rememberMe: boolean;
}

const a = 1;

const b = 2;


export interface ConfirmResetPasswordOptions {
	email: string;
	password: string;
	passwordConfirmation: string;
	token: string;
}

export interface CreatePasskeyOptions {
	rawId: string;
	response: {
		attestationObject: string;
		clientDataJSON: string;
	};
}

export interface AuthenticatePasskeyOptions {
	credentialId: string;
	rawId: string;
	response: {
		authenticatorData: string;
		clientDataJSON: string;
		signature: string;
	};
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
			excludeCredentials: excludeCredentials.map((credential) => ({
				...credential,
				id: convertBase64ToArrayBuffer(credential.id)
			})),
			user: {
				...user,
				id: convertBase64ToArrayBuffer(user.id)
			}
		}
	};
};

export const Authentication = {
	api: api.url("auth"),
	async assertGuest() {
		const session = await this.getOptionalSession();
		if (session) return redirect(urls.default);
	},
	confirmResetPassword(options: ConfirmResetPasswordOptions) {
		return this.api.url("/password/reset").json(options).post().res();
	},
	async getOnboardedSession() {
		const session = await this.getSession();

		if (session.user.status === "registered")
			return redirect(urls.onboarding(1));
		if (session.user.deactivatedAt)
			return redirect(urls.settings.deactivateAccount);

		return session;
	},
	async getOptionalSession() {
		const session = await this.api
			.url("/session")
			.get()
			.unauthorized(() => null)
			.json<Session | null>();

		Sentry.setUser(
			session?.user.preferences?.privacy.analytics
				? { id: session?.user.id }
				: null
		);

		return session;
	},
	async getSession() {
		const session = await this.getOptionalSession();
		if (!session) return redirect(urls.login());

		return session;
	},
	impersonate(userId: string) {
		return this.api.url("/sudo").json({ userId }).post().json<Session>();
	},
	login(options: LoginOptions) {
		return this.api
			.url("/session")
			.json(options)
			.post()
			.unauthorized((reason) => {
				if (isWretchError(reason)) return reason.json;
			})
			.json<Session | Issue<"invalid_credentials"> | Issue<"account_banned">>();
	},
	logout() {
		return this.api.url("/session").delete().res();
	},
	passkey: {
		api: api.url("auth/passkey"),
		authenticate(options: AuthenticatePasskeyOptions) {
			return this.api.url("/authenticate").json(options).post().res();
		},
		async authenticationChallenge() {
			const { publicKey } = await this.api
				.url("/authentication-challenge")
				.get()
				.json<{ publicKey: PublicKeyCredentialRequestOptionsBase64 }>();

			return {
				publicKey: {
					...publicKey,
					challenge: convertBase64ToArrayBuffer(publicKey.challenge)
				}
			};
		},
		create(options: CreatePasskeyOptions) {
			return this.api.json(options).post().res();
		},
		delete(passkeyId: string) {
			return this.api.query({ passkeyId }).delete().res();
		},
		async registrationChallenge(platform?: boolean) {
			const { publicKey } = await this.api
				.url("/registration-challenge")
				.query({ platform })
				.get()
				.json<{ publicKey: PublicKeyCredentialCreationOptionsBase64 }>();

			return convertPublicKey(publicKey);
		}
	},
	resetPassword(email: string) {
		return this.api.url("/password").json({ email }).delete().res();
	},
	revokeImpersonate() {
		return this.api.url("/sudo").delete().json<Session>();
	},
	sso(signer: string) {
		return this.api.url(`/sso/${signer}`).get().json<{ token: string }>();
	}
};

Authentication.getOptionalSession = cache(
	Authentication.getOptionalSession.bind(Authentication)
);
