import { ModelCard } from "~/components/model-card";

import { LoginForm } from "./form";

export const config = { runtime: "experimental-edge" };

export interface LoginPageProps {
	searchParams: {
		to?: string;
	};
}

export default function LoginPage(props: LoginPageProps) {
	return (
		<ModelCard className="sm:w-full sm:max-w-lg" title="Login">
			<LoginForm to={props.searchParams.to} />
		</ModelCard>
	);
}
