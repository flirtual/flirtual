import { InAppReview } from "@capacitor-community/in-app-review";
import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import { activeEntitlements, User } from "~/api/user";
import { Form } from "~/components/forms";
import { FormAlternativeActionLink } from "~/components/forms/alt-action-link";
import { FormButton } from "~/components/forms/button";
import { InlineLink } from "~/components/inline-link";
import { InputLabel, InputSelect, InputText } from "~/components/inputs";
import { InputTextArea } from "~/components/inputs/textarea";
import { SupportButton } from "~/components/layout/support-button";
import { useAttributes, useAttributeTranslation } from "~/hooks/use-attribute";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

export const DeleteForm: FC = () => {
	const { native } = useDevice();
	const { t } = useTranslation();
	const tAttribute = useAttributeTranslation();
	const deleteReasons = useAttributes("delete-reason");

	const { user } = useSession();
	const hasPassword = user.hasPassword === true;

	const entitlements = activeEntitlements(user);
	const lifetime = entitlements.find((entitlement) => entitlement.kind === "one_time");

	const appleSubscription = entitlements.find(
		(entitlement) =>
			entitlement.kind === "subscription" && entitlement.store === "app_store"
	);

	const otherSubscription = entitlements.find(
		(entitlement) =>
			entitlement.kind === "subscription" && entitlement.store !== "app_store"
	);

	return (
		<Form
			withCaptcha
			fields={{
				reasonId: "",
				comment: "",
				...(hasPassword ? { currentPassword: "" } : {})
			}}
			className="flex flex-col gap-8"
			onSubmit={async (body, { captcha }) => {
				await User.deleteSelf({ ...body, captcha });
				await invalidate({ queryKey: sessionKey() });
			}}
		>
			{({ FormField, fields }) => (
				<>
					{entitlements.length > 0 && (
						<div className="rounded-lg bg-brand-gradient px-6 py-4">
							<span className="flex flex-col gap-4 font-montserrat text-white-10">
								{lifetime && (
									<span>
										⚠️
										{" "}
										{t("delete_lifetime_warning")}
									</span>
								)}
								{appleSubscription && (
									<span>
										⚠️
										{" "}
										{t("delete_subscription_warning")}
										<br />
										<br />
										<Trans
											components={{
												link: (
													<InlineLink
														className="underline"
														href={urls.manageSubscription.app_store}
													/>
												)
											}}
											i18nKey="delete_subscription_apple"
										/>
									</span>
								)}
								{otherSubscription && (
									<span>{t("delete_subscription_cancel")}</span>
								)}
							</span>
						</div>
					)}
					<span>{t("antsy_calm_mallard_expand")}</span>
					<FormField name="reasonId">
						{(field) => (
							<>
								<InputLabel>{t("reason")}</InputLabel>
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
									placeholder={t("select_a_reason")}
									onChange={(value) => {
										field.props.onChange(value);
										if (value === "jrAqzBkasZwqfjSPAazNq3" && native)
											void InAppReview.requestReview();
									}}
								/>
								{field.props.value === "sQcEHRLCffbLfcgM4zAELf"
									? (
											<p>
												<Trans
													components={{
														deactivateLink: <InlineLink href={urls.settings.deactivateAccount} />
													}}
													i18nKey="brave_bald_bison_trim"
												/>
												{" "}
											</p>
										)
									: field.props.value === "J3vVp9PWZQi5cEuk8G8wij"
										? (
												<p>
													{t("need_help")}
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
								<InputLabel>{t("comment")}</InputLabel>
								<InputTextArea
									{...field.props}
									placeholder={
										fields.reasonId.props.value === "jrAqzBkasZwqfjSPAazNq3"
											? t("odd_blue_clownfish_gleam")
											: t("dirty_pink_puffin_flow")
									}
									maxLength={1000}
									rows={4}
								/>
							</>
						)}
					</FormField>
					{hasPassword && (
						<FormField name="currentPassword">
							{(field) => (
								<>
									<InputLabel>{t("confirm_current_password")}</InputLabel>
									<InputText
										{...field.props}
										autoComplete="current-password"
										type="password"
									/>
								</>
							)}
						</FormField>
					)}
					<div className="flex flex-col gap-4">
						<span>
							<Trans i18nKey="teary_cuddly_midge_sew" />
						</span>
					</div>
					<FormButton>{t("delete_account")}</FormButton>
					<FormAlternativeActionLink href={urls.settings.deactivateAccount}>
						{t("white_tasty_trout_gleam")}
					</FormAlternativeActionLink>
				</>
			)}
		</Form>
	);
};
