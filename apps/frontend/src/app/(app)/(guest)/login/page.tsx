import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";
import { MessageKeys } from "~/i18n/request";

import { LoginForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Login"
};

export interface LoginPageProps {
	searchParams?: Promise<{
		next?: string;
		error?: string;
	}>;
}

export default async function LoginPage(props: LoginPageProps) {
	const { error, next } = (await props.searchParams) || {};
	const t = await getTranslations();

	return (
		<ModelCard className="gap-4 desktop:w-full desktop:max-w-lg" title="Log in">
			{error && error !== "access_denied" && (
				<div className="mb-8 rounded-lg bg-brand-gradient px-6 py-4">
					<span className="font-montserrat text-lg text-white-10">
						{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
						{t(`errors.${error}` as any)}
					</span>
				</div>
			)}
			<LoginForm next={next} />
		</ModelCard>
	);
}
