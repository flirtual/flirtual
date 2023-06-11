import { Metadata } from "next";

import { RegisterForm } from "./form";

import { ModelCard } from "~/components/model-card";

export const metadata: Metadata = {
	title: "Create account"
};

export default function RegisterPage() {
	return (
		<ModelCard title="Create account">
			<RegisterForm />
		</ModelCard>
	);
}
