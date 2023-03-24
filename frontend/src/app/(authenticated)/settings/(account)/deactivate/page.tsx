"use client";

import { ModelCard } from "~/components/model-card";
import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { InputLabel, InputText } from "~/components/inputs";
import { FormButton } from "~/components/forms/button";
import { urls } from "~/urls";
import { useSession } from "~/hooks/use-session";

export default function SettingsAccountDeactivatePage() {
	const [session, mutateSession] = useSession();
	if (!session) return null;

	const deactivated = !!session.user.deactivatedAt;

	return (
		<ModelCard title={deactivated ? "Reactivate account" : "Deactivate account"}>
			<Form
				className="flex flex-col gap-8"
				requireChange={!deactivated}
				fields={{
					currentPassword: ""
				}}
				onSubmit={async (body) => {
					await mutateSession({
						...session,
						user: deactivated
							? await api.user.reactivate(session.user.id)
							: await api.user.deactivate(session.user.id, { body })
					});
				}}
			>
				{({ FormField }) => (
					<>
						{deactivated ? (
							<>
								<span>This will make your profile visible to other users again.</span>
							</>
						) : (
							<>
								<span>
									This will temporarily remove you from matchmaking and hide your profile from other
									users until you come back here and reactivate your account.
								</span>
								<FormField name="currentPassword">
									{(field) => (
										<>
											<InputLabel>Confirm current password</InputLabel>
											<InputText {...field.props} autoComplete="current-password" type="password" />
										</>
									)}
								</FormField>
							</>
						)}
						<div className="flex flex-col gap-4">
							<FormButton>{deactivated ? "Reactivate account" : "Deactivate account"}</FormButton>
							<FormAlternativeActionLink href={urls.settings.deleteAccount}>
								Permanently delete your account instead?
							</FormAlternativeActionLink>
						</div>
					</>
				)}
			</Form>
		</ModelCard>
	);
}
