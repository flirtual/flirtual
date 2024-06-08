"use client";

import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { RateApp } from "capacitor-rate-app";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { InputLabel, InputSelect, InputText } from "~/components/inputs";
import { FormButton } from "~/components/forms/button";
import { urls } from "~/urls";
import { InputTextArea } from "~/components/inputs/textarea";
import { AttributeCollection } from "~/api/attributes";
import { SupportButton } from "~/components/layout/support-button";
import { InlineLink } from "~/components/inline-link";
import { useSession } from "~/hooks/use-session";

export const DeleteForm: FC<{
	deleteReasons: AttributeCollection<"delete-reason">;
}> = ({ deleteReasons }) => {
	const router = useRouter();
	const [requestRating, setRequestRating] = useState(false);

	useEffect(() => {
		if (requestRating) void RateApp.requestReview();
	}, [requestRating]);

	const [session] = useSession();
	if (!session) return null;
	const { subscription } = session.user;

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
					{subscription?.active &&
						["ios", "android"].includes(subscription.platform) && (
							<div className="rounded-lg bg-brand-gradient px-6 py-4">
								<span className="font-montserrat text-white-10">
									⚠️ Warning: You have an active subscription that will not be
									canceled automatically if you delete your account.
									<br />
									<br />
									Please cancel your subscription in{" "}
									{subscription.platform === "ios"
										? "the App Store"
										: "Google Play"}{" "}
									before deleting your account.
								</span>
							</div>
						)}
					<span className="select-none">
						We&apos;re sorry to see you go. Would you mind telling us why
						you&apos;re deleting your account so we can improve?
					</span>
					<FormField name="reasonId">
						{(field) => (
							<>
								<InputLabel>Reason</InputLabel>
								<InputSelect
									{...field.props}
									placeholder="Select a reason"
									options={deleteReasons.map((attribute) => ({
										id: attribute.id,
										name: attribute.name
									}))}
									onChange={(value) => {
										field.props.onChange(value);
										setRequestRating(value === "jrAqzBkasZwqfjSPAazNq3");
									}}
								/>
								{field.props.value === "sQcEHRLCffbLfcgM4zAELf" ? (
									<p className="select-none">
										Taking a break? You can{" "}
										<InlineLink href={urls.settings.deactivateAccount}>
											temporarily deactivate your account
										</InlineLink>{" "}
										instead! No one can see your profile while it&apos;s
										deactivated.
									</p>
								) : field.props.value === "J3vVp9PWZQi5cEuk8G8wij" ? (
									<p>
										Need help? <SupportButton />.
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
										fields.reasonId.props.value === "jrAqzBkasZwqfjSPAazNq3"
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
								<InputText
									{...field.props}
									autoComplete="current-password"
									type="password"
								/>
							</>
						)}
					</FormField>
					<div className="flex flex-col gap-4">
						<span className="select-none">
							Are you sure you want to delete your account?{" "}
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
