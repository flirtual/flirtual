import { decode } from "jsonwebtoken";

import { ResetPasswordForm } from "./form";

import { ModelCard } from "~/components/model-card";

export interface ResetPasswordPageProps {
	params: { token: string };
}

export default function ResetPasswordPage({
	params: { token }
}: ResetPasswordPageProps) {
	const payload = decode(token, { json: true });
	if (!payload?.sub) return null;

	return (
		<ModelCard title="Reset Password">
			<ResetPasswordForm email={payload.sub} token={token} />
		</ModelCard>
	);
}
