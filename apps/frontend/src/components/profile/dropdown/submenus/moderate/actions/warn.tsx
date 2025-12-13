import { Languages, MailWarning } from "lucide-react";
import { useMemo } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

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
import { InputCheckbox, InputLabel, InputSelect, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import type { AttributeTranslation } from "~/hooks/use-attribute";
import { useDialog } from "~/hooks/use-dialog";
import { useToast } from "~/hooks/use-toast";
import { defaultLocale, i18n, useLocale } from "~/i18n";
import { invalidate, userKey } from "~/query";

const WarnDialog: FC<{ user: User; onClose: () => void }> = withSuspense(({ user, onClose }) => {
	const toasts = useToast();
	const { t } = useTranslation();
	const [locale] = useLocale();

	const languageNames = useMemo(
		() => new Intl.DisplayNames(locale, { type: "language" }),
		[locale]
	);

	const reasons = useAttributes("warn-reason");
	const defaultReasonObject = reasons.find((reason) => {
		if (typeof reason === "string") return false;
		return reason.fallback === true;
	}) as { id: string; fallback: boolean; shadowban?: boolean } | undefined;
	const defaultReason = defaultReasonObject?.id ?? (reasons[0] as string);
	const defaultShadowban = defaultReasonObject?.shadowban ?? false;
	const tAttribute = useAttributeTranslation("warn-reason");

	const expectedLanguageName = tAttribute[user.preferences?.language ?? "en"]?.name
		?? languageNames.of(user.preferences?.language ?? "en")
		?? user.preferences?.language;

	return (
		<Dialog
			defaultOpen
			onOpenChange={(open) => {
				if (!open) {
					onClose();
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
							reasonId: defaultReason,
							message: user.moderatorMessage || tAttribute[defaultReason]?.details || "",
							shadowban: defaultShadowban
						}}
						className="flex flex-col gap-8"
						requireChange={false}
						onSubmit={async ({ targetId, message, reasonId, shadowban }) => {
							if (!message) {
								await User.deleteWarn(targetId);
								await invalidate({ queryKey: userKey(user.id) });

								toasts.add(t("account_warning_removed"));
								onClose();

								return;
							}

							const messageChanged = message !== tAttribute[reasonId]?.details;

							if (!messageChanged) {
								const targetLocale = user.preferences?.language ?? defaultLocale;
								await i18n.loadLanguages(targetLocale);

								const targetT = i18n.getFixedT(user.preferences?.language ?? defaultLocale);
								const attributes = targetT("attributes", { returnObjects: true });

								message = (attributes[reasonId] as AttributeTranslation<"warn-reason">)?.details || message;
							}

							await User.warn(targetId, { reasonId, message, shadowban });
							await invalidate({ queryKey: userKey(user.id) });

							toasts.add(t("account_warned"));
							onClose();
						}}
					>
						{({ FormField, fields: { message, reasonId, shadowban } }) => (
							<>
								<FormField name="targetId">
									{(field) => (
										<>
											<InputLabel {...field.labelProps}>Target</InputLabel>
											<div className="flex items-center gap-4">
												<UserThumbnail user={user} />
												<div className="flex flex-col">
													<span className="text-lg font-semibold leading-none">
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
								<FormField name="reasonId">
									{({ props }) => (
										<InputSelect
											{...props}
											options={reasons.map((reason) => {
												const id = typeof reason === "string" ? reason : reason.id;

												return ({
													id,
													name: tAttribute[id]?.name || id
												});
											})}
											onChange={(value) => {
												props.onChange(value);
												message.props.onChange(
													tAttribute[value]?.details || ""
												);

												const selectedReason = reasons.find((r) => {
													const id = typeof r === "string" ? r : r.id;
													return id === value;
												});

												if (selectedReason && typeof selectedReason !== "string") {
													shadowban.props.onChange(selectedReason.shadowban ?? false);
												}
												else {
													shadowban.props.onChange(false);
												}
											}}
										/>
									)}
								</FormField>
								<FormField name="message">
									{(field) => (
										<>
											<InputLabel {...field.labelProps}>Message</InputLabel>
											<InputTextArea
												{...field.props}
												placeholder="Write a custom warning message for the user."
												rows={6}
											/>
										</>
									)}
								</FormField>
								{message.props.value !== tAttribute[reasonId.props.value]?.details
									&& user.preferences?.language && user.preferences?.language !== locale && (
									<div className="flex flex-col gap-4">
										<FormMessage size="sm" type="warning">
											Custom messages are not automatically translated.
											{" "}
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
										onClick={() => onClose()}
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
});

export const WarnAction: FC<{ user: User }> = ({ user }) => {
	const dialogs = useDialog();

	return (
		<DropdownMenuItem
			asChild
			className="text-yellow-500"
			onSelect={() => {
				const dialog = <WarnDialog user={user} onClose={() => dialogs.remove(dialog)} />;
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
