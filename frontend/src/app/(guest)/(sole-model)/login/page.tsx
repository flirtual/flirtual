import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { LoginForm } from "./form";

export const metadata: Metadata = {
	title: "Login"
};

export interface LoginPageProps {
	searchParams?: {
		next?: string;
	};
}

export default function LoginPage(props: LoginPageProps) {
	return (
		<ModelCard className="sm:w-full sm:max-w-lg" title="Log in">
			<LoginForm next={props.searchParams?.next} />
		</ModelCard>
	);
}
