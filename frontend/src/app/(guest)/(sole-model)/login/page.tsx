import { ModelCard } from "~/components/model-card";

import { LoginForm } from "./form";

export interface LoginPageProps {
	searchParams?: {
		to?: string;
	};
}

export default function LoginPage(props: LoginPageProps) {
	return (
		<ModelCard className="sm:w-full sm:max-w-lg" title="Log in">
			<LoginForm to={props.searchParams?.to} />
		</ModelCard>
	);
}
