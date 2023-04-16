import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { RegisterForm } from "./form";

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
