"use client";

import { useRouter } from "next/navigation";

import { ModelCard } from "~/components/model-card";
import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { InputLabel, InputSelect, InputText } from "~/components/inputs";
import { FormButton } from "~/components/forms/button";
import { urls } from "~/urls";
import { useSession } from "~/hooks/use-session";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { sortBy } from "~/utilities";
import { InputTextArea } from "~/components/inputs/textarea";

export default function SettingsAccountDeactivatePage() {
	const [session] = useSession();
	const router = useRouter();

	const deleteReasons = useAttributeList("delete-reason");

	if (!session) return null;

	return (
		<ModelCard title="Delete Account">
			<Form
				withCaptcha
				className="flex flex-col gap-8"
				fields={{
					reasonId: "",
					comment: "",
					currentPassword: ""
				}}
				onSubmit={async (body, { captcha }) => {
					await api.user.delete({ body: { ...body, captcha } });
					router.refresh();
				}}
			>
				{({ FormField }) => (
					<>
						<span>
							We&apos;re sorry to see you go. Would you mind telling us why you&apos;re deleting
							your account so we can improve?
						</span>
						<FormField name="reasonId">
							{(field) => (
								<>
									<InputLabel>Reason</InputLabel>
									<InputSelect
										{...field.props}
										placeholder="Select a reason"
										options={sortBy(deleteReasons, ({ metadata }) => metadata.order).map(
											(attribute) => ({
												key: attribute.id,
												label: attribute.name
											})
										)}
									/>
								</>
							)}
						</FormField>
						<FormField name="comment">
							{(field) => (
								<>
									<InputLabel>Comment</InputLabel>
									<InputTextArea
										{...field.props}
										placeholder="If you'd like to share more information, please leave us a comment here!"
										rows={4}
									/>
								</>
							)}
						</FormField>
						<FormField name="currentPassword">
							{(field) => (
								<>
									<InputLabel>Confirm current password</InputLabel>
									<InputText {...field.props} autoComplete="current-password" type="password" />
								</>
							)}
						</FormField>
						<div className="flex flex-col gap-4">
							<span>
								Are you sure you want to delete your account?{" "}
								<span className="font-semibold">This action is irreversible</span>.
							</span>
						</div>
						<FormButton>Delete account</FormButton>
						<FormAlternativeActionLink href={urls.settings.deactivateAccount}>
							Temporarily deactivate your account instead?
						</FormAlternativeActionLink>
					</>
				)}
			</Form>
		</ModelCard>
	);
}
