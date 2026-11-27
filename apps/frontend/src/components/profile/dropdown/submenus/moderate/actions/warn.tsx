import { queryOptions, useSuspenseQueries } from "@tanstack/react-query";
import { Languages, MailWarning } from "lucide-react";
import { useMemo } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import { byId, languagesOptions, warnReasonsOptions } from "~/api/data";
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
import { useDialog } from "~/hooks/use-dialog";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { defaultLocale, useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";
import { invalidate, queryClient, userKey } from "~/query";

export const WarnDialog: FC<{
	user: User;
	initial?: { reasonId: string; message: string; shadowban: boolean; disable: boolean };
	onWarn?: () => unknown;
	onClose: () => void;
}> = withSuspense(({ user, initial, onWarn, onClose }) => {
	const session = useSession();
	const toasts = useToast();
	const { t } = useTranslation();
	const [locale] = useLocale();

	const languageNames = useMemo(
		() => new Intl.DisplayNames(intlLocale(locale), { type: "language" }),
		[locale]
	);

	const [{ data: reasons }, { data: languages }] = useSuspenseQueries({
		queries: [warnReasonsOptions({ locale }), queryOptions({ ...languagesOptions({ locale }), select: byId })]
	});
	const reasonsById = byId(reasons);
	const defaultEntry = reasons.find((reason) => reason.default === true);
	const defaultReason = defaultEntry?.id ?? reasons[0]?.id;
	const defaultShadowban = defaultEntry?.shadowban ?? false;

	const expectedLanguageName = languages[user.preferences?.language ?? defaultLocale]?.name
		?? languageNames.of(user.preferences?.language ?? defaultLocale)
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
							reasonId: initial?.reasonId ?? defaultReason,
							message: initial?.message ?? (user.moderatorMessage || (defaultReason && reasonsById[defaultReason]?.details) || ""),
							shadowban: initial?.shadowban ?? defaultShadowban,
							disable: initial?.disable ?? user.disabledUntilAcknowledged ?? false
						}}
						className="flex flex-col gap-8"
						requireChange={false}
						onSubmit={async ({ targetId, message, reasonId, shadowban, disable }) => {
							if (!message) {
								await User.deleteWarn(targetId);
								await invalidate({ queryKey: userKey(user.id) });

								toasts.add(t("account_warning_removed"));
								onClose();

								return;
							}

							const messageChanged = message !== reasonsById[reasonId]?.details;

							if (!messageChanged) {
								const targetLocale = user.preferences?.language ?? defaultLocale;
								const reasons = await queryClient.fetchQuery(warnReasonsOptions({ locale: targetLocale }));

								message = reasons.find(({ id }) => id === reasonId)?.details || message;
							}

							await User.warn(targetId, { reasonId, message, shadowban, disable });
							await invalidate({ queryKey: userKey(user.id) });
							await onWarn?.();

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
													<span className="text-lg leading-none font-semibold">
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
												const { id, name } = reason;

												return ({
													id,
													name: name || id
												});
											})}
											onChange={(value) => {
												props.onChange(value);
												message.props.onChange(
													reasonsById[value]?.details || ""
												);

												const selectedReason = reasons.find(({ id }) => id === value);

												if (selectedReason) {
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
								{message.props.value !== reasonsById[reasonId.props.value]?.details
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
													language: user.preferences?.language ?? defaultLocale,
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
								{session.user.tags?.includes("admin") && (
									<FormField name="disable">
										{(field) => (
											<div className="flex items-center gap-4">
												<InputCheckbox {...field.props} />
												<InputLabel {...field.labelProps}>
													Disable account until acknowledged
												</InputLabel>
											</div>
										)}
									</FormField>
								)}
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
