import { Gavel, Languages } from "lucide-react";
import { useMemo } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { withSuspense } from "with-suspense";

import type { ProspectKind } from "~/api/matchmaking";
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
import { InputLabel, InputSelect, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import type { AttributeTranslation } from "~/hooks/use-attribute";
import { useDialog } from "~/hooks/use-dialog";
import { useQueue } from "~/hooks/use-queue";
import { useToast } from "~/hooks/use-toast";
import { defaultLocale, i18n, useLocale } from "~/i18n";
import { mutate, userKey } from "~/query";

const SuspendDialog: FC<{ user: User; onClose: () => void }> = withSuspense(({ user, onClose }) => {
	const toasts = useToast();

	const [query] = useSearchParams();
	const kind = (query.get("kind") || "love") as ProspectKind;

	const { forward: forwardQueue } = useQueue(kind);

	const [locale] = useLocale();

	const languageNames = useMemo(
		() => new Intl.DisplayNames(locale, { type: "language" }),
		[locale]
	);

	const reasons = useAttributes("ban-reason");
	const defaultReason = reasons[0] as string;
	const { t } = useTranslation();
	const tAttribute = useAttributeTranslation("ban-reason");

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
					<DialogTitle>Ban profile</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<Form
						fields={{
							targetId: user.id,
							reasonId: defaultReason,
							message: tAttribute[defaultReason]!.details
						}}
						className="flex flex-col gap-8"
						requireChange={false}
						onSubmit={async ({ targetId, reasonId, message }) => {
							const messageChanged = message !== tAttribute[reasonId]?.details;

							if (!messageChanged) {
								const targetLocale = user.preferences?.language ?? defaultLocale;
								await i18n.loadLanguages(targetLocale);

								const targetT = i18n.getFixedT(user.preferences?.language ?? defaultLocale);
								const attributes = targetT("attributes", { returnObjects: true });

								message = (attributes[reasonId] as AttributeTranslation<"ban-reason">)?.details || message;
							}

							const newTarget = await User.suspend(targetId, { reasonId, message });

							await mutate(userKey(user.id), newTarget);
							await forwardQueue();

							toasts.add(t("account_banned"));
							onClose();
						}}
					>
						{({ FormField, fields: { message, reasonId } }) => (
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
												placeholder="Write a custom ban reason for the user."
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
								<DialogFooter>
									<Button
										kind="tertiary"
										size="sm"
										onClick={() => onClose()}
									>
										Cancel
									</Button>
									<FormButton size="sm">Yonk</FormButton>
								</DialogFooter>
							</>
						)}
					</Form>
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
});

export const SuspendAction: FC<{ user: User }> = ({ user }) => {
	const dialogs = useDialog();

	return (
		<DropdownMenuItem
			asChild
			className="text-red-500"
			disabled={!!user.bannedAt}
			onSelect={() => {
				const dialog = <SuspendDialog user={user} onClose={() => dialogs.remove(dialog)} />;
				dialogs.add(dialog);
			}}
		>
			<button className="w-full gap-2" type="button">
				<Gavel className="size-5" />
				Ban
			</button>
		</DropdownMenuItem>
	);
};
