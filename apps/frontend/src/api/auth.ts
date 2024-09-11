import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import { cache } from "react";

import { urls } from "~/urls";

import { api, type DatedModel } from "./common";

import type { User } from "./user";

export type Session = DatedModel & {
	sudoerId?: string;
	user: User;
};

export interface LoginOptions {
	login: string;
	password: string;
	rememberMe: boolean;
}

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

export const Authentication = {
	api: api.url("auth"),
	login(options: LoginOptions) {
		return this.api.url("/session").json(options).post().json<Session>();
	},
	logout() {
		return this.api.url("/session").delete().res();
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
	async getOnboardedSession() {
		const session = await this.getSession();

		if (session.user.status === "registered")
			return redirect(urls.onboarding(1));
		if (session.user.deactivatedAt)
			return redirect(urls.settings.deactivateAccount);

		return session;
	},
	async assertGuest() {
		const session = await this.getOptionalSession();
		if (session) return redirect(urls.default);
	},
	resetPassword(email: string) {
		return this.api.url("/password").json({ email }).delete().res();
	},
	confirmResetPassword(options: ConfirmResetPasswordOptions) {
		return this.api.url("/password/reset").json(options).post().res();
	},
	sso(signer: string) {
		return this.api.url(`/sso/${signer}`).get().json<{ token: string }>();
	},
	passkey: {
		api: api.url("auth/passkey"),
		create(options: CreatePasskeyOptions) {
			return this.api.json(options).post().res();
		},
		delete(passkeyId: string) {
			return this.api.query({ passkeyId }).delete().res();
		},
		authenticate(options: AuthenticatePasskeyOptions) {
			return this.api.url("/authenticate").json(options).post().res();
		},
		async registrationChallenge(platform?: boolean) {
			const { publicKey } = await this.api
				.url("/registration-challenge")
				.query({ platform })
				.get()
				.json<{ publicKey: PublicKeyCredentialCreationOptionsBase64 }>();

			return convertPublicKey(publicKey);
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
		}
	},
	impersonate(userId: string) {
		const a = this.api.url("/sudo");
		console.log(a);
		return a.json({ userId }).post().json<Session>();
	},
	revokeImpersonate() {
		return this.api.url("/sudo").delete().json<Session>();
	}
};

Authentication.getOptionalSession = cache(
	Authentication.getOptionalSession.bind(Authentication)
);
