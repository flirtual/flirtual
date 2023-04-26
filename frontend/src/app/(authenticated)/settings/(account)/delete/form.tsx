"use client";

import { useRouter } from "next/navigation";
import { FC } from "react";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { InputLabel, InputSelect, InputText } from "~/components/inputs";
import { FormButton } from "~/components/forms/button";
import { urls } from "~/urls";
import { sortBy } from "~/utilities";
import { InputTextArea } from "~/components/inputs/textarea";
import { AttributeCollection } from "~/api/attributes";
import { HeaderSupportButton } from "~/components/layout/support-button";
import { InlineLink } from "~/components/inline-link";

export const DeleteForm: FC<{ deleteReasons: AttributeCollection<"delete-reason"> }> = ({
	deleteReasons
}) => {
	const router = useRouter();

	return (
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
			{({ FormField, fields }) => (
				<>
					<span>
						We&apos;re sorry to see you go. Would you mind telling us why you&apos;re deleting your
						account so we can improve?
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
								{field.props.value === "d1c0d422-f2cc-48ea-8303-a816a95ce979" ? (
									<p>
										Taking a break? You can{" "}
										<InlineLink href={urls.settings.deactivateAccount}>
											temporarily deactivate your account
										</InlineLink>{" "}
										instead! No one can see your profile while it&apos;s deactivated.
									</p>
								) : field.props.value === "ea79aa62-9259-4704-ba72-29f63b369e91" ? (
									<p>
										Need help? <HeaderSupportButton />.
									</p>
								) : null}
							</>
						)}
					</FormField>
					<FormField name="comment">
						{(field) => (
							<>
								<InputLabel>Comment</InputLabel>
								<InputTextArea
									{...field.props}
									rows={4}
									placeholder={
										fields.reasonId.props.value === "0a4a8c58-f64b-4d94-87e6-f2d92dcd9086"
											? "We're always looking for success stories! Would you like to share one? By doing so, you agree that we may share your story."
											: "If you'd like to share more information, please leave us a comment here!"
									}
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
	);
};
