import { ModelCard } from "~/components/model-card";

import { LoginForm } from "./form";

export interface LoginPageProps {
	params: {
		to?: string;
	};
}

export default function LoginPage(props: LoginPageProps) {
	return (
		<ModelCard className="sm:w-full sm:max-w-lg" title="Login">
			<LoginForm to={props.params.to} />
		</ModelCard>
	);
}
