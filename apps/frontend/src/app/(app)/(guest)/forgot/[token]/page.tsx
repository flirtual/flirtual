import { decode } from "jsonwebtoken";

import { ModelCard } from "~/components/model-card";

import { ResetPasswordForm } from "./form";

export interface ResetPasswordPageProps {
	params: { token: string };
}

export default function ResetPasswordPage({
	params: { token }
}: ResetPasswordPageProps) {
	const payload = decode(token, { json: true });
	if (!payload?.sub) return null;

	return (
		<ModelCard title="Reset password">
			<ResetPasswordForm email={payload.sub} token={token} />
		</ModelCard>
	);
}
