import { Languages, MailWarning } from "lucide-react";
import { useMemo } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { OpenAI } from "~/api/openai";
import { User } from "~/api/user";
import { Button } from "~/components/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { DropdownMenuItem } from "~/components/dropdown";
import { Form, FormButton, FormMessage } from "~/components/forms";
import { InputCheckbox, InputLabel, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useDialog } from "~/hooks/use-dialog";
import { useToast } from "~/hooks/use-toast";
import { useLocale } from "~/i18n";
import { invalidate, userKey } from "~/query";

export const WarnAction: FC<{ user: User }> = ({ user }) => {
	const toasts = useToast();
	const { t } = useTranslation();
	const [locale] = useLocale();
	const dialogs = useDialog();

	const languageNames = useMemo(
		() => new Intl.DisplayNames(locale, { type: "language" }),
		[locale]
	);

	const tAttribute = useAttributeTranslation();
	const expectedLanguageName = tAttribute[user.preferences?.language ?? "en"]?.name
		?? languageNames.of(user.preferences?.language ?? "en")
		?? user.preferences?.language;

	return (
		<DropdownMenuItem
			asChild
			className="text-yellow-500"
			onSelect={() => {
				const dialog = (
					<Dialog
						defaultOpen
						onOpenChange={(open) => {
							if (!open) {
								dialogs.remove(dialog);
							}
						}}
					>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Warn profile</DialogTitle>
							</DialogHeader>
							<DialogBody>
								<Form
									fields={{
										targetId: user.id,
										message: user.moderatorMessage ?? "",
										shadowban: false
									}}
									className="flex flex-col gap-8"
									requireChange={false}
									onSubmit={async ({ targetId, message, shadowban }) => {
										if (!message) {
											await User.deleteWarn(targetId);
											await invalidate({ queryKey: userKey(user.id) });

											toasts.add(t("account_warning_removed"));
											dialogs.remove(dialog);

											return;
										}

										await User.warn(targetId, { message, shadowban });
										await invalidate({ queryKey: userKey(user.id) });

										toasts.add(t("account_warned"));
										dialogs.remove(dialog);
									}}
								>
									{({ FormField, fields: { message } }) => (
										<>
											<FormField name="targetId">
												{(field) => (
													<>
														<InputLabel {...field.labelProps}>Target</InputLabel>
														<div className="flex items-center gap-4">
															<UserThumbnail user={user} />
															<div className="flex flex-col">
																<span
																	data-mask
																	className="text-lg font-semibold leading-none"
																>
																	{user.profile.displayName || t("unnamed_user")}
																</span>
																<span className="font-mono text-sm brightness-75">
																	{user.id}
																</span>
															</div>
														</div>
													</>
												)}
											</FormField>
											<FormField name="message">
												{(field) => (
													<>
														<InputLabel {...field.labelProps}>Message</InputLabel>
														<InputTextArea autoFocus {...field.props} rows={6} />
													</>
												)}
											</FormField>
											{user.preferences?.language && user.preferences.language !== locale && (
												<div className="flex flex-col gap-4">
													<FormMessage size="sm" type="warning">
														Please translate to the user's preferred language (
														{expectedLanguageName}
														) before sending. Double check the translation for accuracy!
													</FormMessage>
													<Button
														Icon={Languages}
														size="sm"
														onClick={async () => {
															const { text } = await OpenAI.translate({
																language: user.preferences?.language ?? "en",
																text: message.props.value
															});

															message.props.onChange(text);
														}}
													>
														Translate to
														{" "}
														{expectedLanguageName}
													</Button>
												</div>
											)}
											<FormField name="shadowban">
												{(field) => (
													<div className="flex items-center gap-4">
														<InputCheckbox {...field.props} />
														<InputLabel {...field.labelProps}>
															Shadowban until acknowledged
														</InputLabel>
													</div>
												)}
											</FormField>
											{!!user.moderatorMessage && message.changed && (
												<FormMessage
													size="sm"
													type={message.props.value ? "informative" : "warning"}
												>
													{user.profile.displayName || t("unnamed_user")}
													{" "}
													still has an
													{" "}
													<strong>unacknowledged warning</strong>
													, you&apos;ll be
													{" "}
													{message.props.value ? "overwriting" : "removing"}
													{" "}
													it.
												</FormMessage>
											)}
											<DialogFooter>
												<Button
													kind="tertiary"
													size="sm"
													onClick={() => dialogs.remove(dialog)}
												>
													Cancel
												</Button>
												<FormButton size="sm">Warn</FormButton>
											</DialogFooter>
										</>
									)}
								</Form>
							</DialogBody>
						</DialogContent>
					</Dialog>
				);

				dialogs.add(dialog);
			}}
		>
			<button className="w-full gap-2" type="button">
				<MailWarning className="size-5" />
				Warn
			</button>
		</DropdownMenuItem>
	);
};
