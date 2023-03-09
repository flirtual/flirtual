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
		<ModelCard title={deactivated ? "Reactivate" : "Deactivate"}>
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
								<span>
									Your profile, photos, matches, and likes will be visible and you will be added
									back into the matchmaking pool.
								</span>
								<span>Maybe you&apos;ll find the right person this time? 💀</span>
							</>
						) : (
							<>
								<span>
									If you temporarily deactivate your account, your profile, photos, matches and
									likes will be hidden, and you will be removed from matchmaking until you come back
									here and reactivate your account.
								</span>
								<span>Keep in mind that you can only deactivate your account once a week.</span>
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
							<FormButton>{deactivated ? "Reactivate" : "Deactivate"}</FormButton>
							<FormAlternativeActionLink href={urls.settings.deleteAccount}>
								Delete your account instead?
							</FormAlternativeActionLink>
						</div>
					</>
				)}
			</Form>
		</ModelCard>
	);
}
