import { ModelCard } from "~/components/model-card";

import { LoginForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Login"
};

export interface LoginPageProps {
	searchParams?: {
		next?: string;
		error?: string;
	};
}

export default function LoginPage(props: LoginPageProps) {
	const error = props.searchParams?.error;

	return (
		<ModelCard className="gap-4 desktop:w-full desktop:max-w-lg" title="Log in">
			{error && (
				<div className="mb-8 rounded-lg bg-brand-gradient px-6 py-4">
					<span className="font-montserrat text-lg text-white-10">{error}</span>
				</div>
			)}
			<LoginForm next={props.searchParams?.next} />
		</ModelCard>
	);
}
