import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModelCard } from "~/components/model-card";

import { LoginForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("login")
	};
}

export interface LoginPageProps {
	searchParams?: Promise<{
		next?: string;
		error?: string;
	}>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const { error, next } = (await searchParams) || {};
	const t = await getTranslations();

	return (
		<ModelCard branded className="shrink-0 desktop:max-w-xl" title={t("log_in")}>
			{error && error !== "access_denied" && (
				<div className="mb-8 rounded-lg bg-brand-gradient px-6 py-4">
					<span className="font-montserrat text-lg text-white-10">
						{t(`errors.${error}` as any)}
					</span>
				</div>
			)}
			<LoginForm next={next} />
		</ModelCard>
	);
}
