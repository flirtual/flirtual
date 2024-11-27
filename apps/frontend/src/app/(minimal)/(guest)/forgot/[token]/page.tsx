import { decode } from "jsonwebtoken";

import { ModelCard } from "~/components/model-card";

import { ResetPasswordForm } from "./form";

export interface ResetPasswordPageProps {
	params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
	const { token } = await params;

	const payload = decode(token, { json: true });
	if (!payload?.sub) return null;

	return (
		<ModelCard title="Reset password">
			<ResetPasswordForm email={payload.sub} token={token} />
		</ModelCard>
	);
}
