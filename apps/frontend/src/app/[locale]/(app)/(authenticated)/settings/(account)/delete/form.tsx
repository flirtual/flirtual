"use client";

import { InAppReview } from "@capacitor-community/in-app-review";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { User } from "~/api/user";
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

	const { user: { subscription } } = useSession();

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
				await invalidate({ queryKey: sessionKey() });
			}}
		>
			{({ FormField, fields }) => (
				<>
					{subscription?.active
					&& ["android", "ios"].includes(subscription.platform) && (
						<div className="rounded-lg bg-brand-gradient px-6 py-4">
							<span className="font-montserrat text-white-10">
								⚠️
								{" "}
								{t("stock_wacky_guppy_pull")}
								<br />
								<br />
								{t(subscription.platform === "ios" ? "alert_dark_leopard_tap" : "helpful_basic_snail_relish")}
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
												{t.rich("brave_bald_bison_trim", {
													link: (children) => (
														<InlineLink href={urls.settings.deactivateAccount}>
															{children}
														</InlineLink>
													)
												})}
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
									rows={4}
								/>
							</>
						)}
					</FormField>
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
					<div className="flex flex-col gap-4">
						<span>
							{t.rich("teary_cuddly_midge_sew", {
								strong: (children) => <strong>{children}</strong>
							})}
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
