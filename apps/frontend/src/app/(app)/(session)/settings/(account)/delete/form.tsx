"use client";

import { InAppReview } from "@capacitor-community/in-app-review";
import { useRouter } from "next/navigation";
import type { FC } from "react";

import { User } from "~/api/user";
import { Form } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { FormButton } from "~/components/forms/button";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputSelect, InputText } from "~/components/inputs";
import { InputTextArea } from "~/components/inputs/textarea";
import { SupportButton } from "~/components/layout/support-button";
import { useAttributes, useAttributeTranslation } from "~/hooks/use-attribute";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

export const DeleteForm: FC = () => {
	const router = useRouter();

	const deleteReasons = useAttributes("delete-reason");
	const tAttribute = useAttributeTranslation();

	const [session] = useSession();
	if (!session) return null;

	const { subscription } = session.user;

	return (
		<Form
			withCaptcha
			fields={{
				reasonId: "",
				comment: "",
				currentPassword: ""
			}}
			className="flex flex-col gap-8"
			onSubmit={async (body, { captcha }) => {
				await User.deleteSelf({ ...body, captcha });
				router.refresh();
			}}
		>
			{({ FormField, fields }) => (
				<>
					{subscription?.active
					&& ["android", "ios"].includes(subscription.platform) && (
						<div className="rounded-lg bg-brand-gradient px-6 py-4">
							<span className="font-montserrat text-white-10">
								⚠️ Warning: You have an active subscription that will not be
								canceled automatically if you delete your account.
								<br />
								<br />
								Please cancel your subscription in
								{" "}
								{subscription.platform === "ios"
									? "the App Store"
									: "Google Play"}
								{" "}
								before deleting your account.
							</span>
						</div>
					)}
					<span>
						We&apos;re sorry to see you go. Would you mind telling us why
						you&apos;re deleting your account so we can improve?
					</span>
					<FormField name="reasonId">
						{(field) => (
							<>
								<InputLabel>Reason</InputLabel>
								<InputSelect
									{...field.props}
									options={deleteReasons.map((attribute) => {
										const id
											= typeof attribute === "object" ? attribute.id : attribute;
										const { name } = tAttribute[id] ?? { name: id };

										return {
											id,
											name
										};
									})}
									placeholder="Select a reason"
									onChange={(value) => {
										field.props.onChange(value);
										if (value === "jrAqzBkasZwqfjSPAazNq3")
											void InAppReview.requestReview();
									}}
								/>
								{field.props.value === "sQcEHRLCffbLfcgM4zAELf"
									? (
											<p>
												Taking a break? You can
												{" "}
												<InlineLink href={urls.settings.deactivateAccount}>
													temporarily deactivate your account
												</InlineLink>
												{" "}
												instead! No one can see your profile while it&apos;s
												deactivated.
											</p>
										)
									: field.props.value === "J3vVp9PWZQi5cEuk8G8wij"
										? (
												<p>
													Need help?
													{" "}
													<SupportButton />
													.
												</p>
											)
										: null}
							</>
						)}
					</FormField>
					<FormField name="comment">
						{(field) => (
							<>
								<InputLabel>Comment</InputLabel>
								<InputTextArea
									{...field.props}
									placeholder={
										fields.reasonId.props.value === "jrAqzBkasZwqfjSPAazNq3"
											? "We're always looking for success stories! Would you like to share one? By doing so, you agree that we may share your story."
											: "If you'd like to share more information, please leave us a comment here!"
									}
									rows={4}
								/>
							</>
						)}
					</FormField>
					<FormField name="currentPassword">
						{(field) => (
							<>
								<InputLabel>Confirm current password</InputLabel>
								<InputText
									{...field.props}
									autoComplete="current-password"
									type="password"
								/>
							</>
						)}
					</FormField>
					<div className="flex flex-col gap-4">
						<span>
							Are you sure you want to delete your account?
							{" "}
							<span className="font-semibold">This action is irreversible</span>
							.
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
