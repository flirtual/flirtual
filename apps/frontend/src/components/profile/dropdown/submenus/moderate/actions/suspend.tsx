import { Gavel, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FC, type PropsWithChildren, useMemo, useState } from "react";
import { withSuspense } from "with-suspense";

import { ProspectKind } from "~/api/matchmaking";
import { OpenAI } from "~/api/openai";
import { displayName, User } from "~/api/user";
import { optimisticQueueMove } from "~/app/[locale]/(app)/(authenticated)/(onboarded)/browse/queue-actions";
import { Button } from "~/components/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "~/components/dialog/dialog";
import { DropdownMenuItem } from "~/components/dropdown";
import { Form, FormButton, FormMessage } from "~/components/forms";
import { InputLabel, InputSelect, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import { useToast } from "~/hooks/use-toast";
import { useSearchParams } from "~/i18n/navigation";
import { mutate, queueKey, userKey } from "~/query";

const SuspendDialog: FC<PropsWithChildren<{ user: User }>> = withSuspense(({ user, children }) => {
	const toasts = useToast();
	const query = useSearchParams();
	const locale = useLocale();

	const languageNames = useMemo(
		() => new Intl.DisplayNames(locale, { type: "language" }),
		[locale]
	);

	const reasons = useAttributes("ban-reason");
	const defaultReason = reasons[0] as string;
	const t = useTranslations();
	const tAttribute = useAttributeTranslation("ban-reason");

	const [open, setOpen] = useState(false);

	const expectedLanguageName = tAttribute[user.preferences?.language ?? "en"]?.name
		?? languageNames.of(user.preferences?.language ?? "en")
		?? user.preferences?.language;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children}
			</DialogTrigger>
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
								const { "ban-reason": banReasons = {} } = (await import(`~/../messages/attributes.${user.preferences?.language}.json`).catch(() => ({
									default: {}
								}))
								).default as Record<string, Record<string, unknown>>;

								// @ts-expect-error: yes.
								message = banReasons[reasonId]?.details || message;
							}

							const newTarget = await User.suspend(targetId, { reasonId, message });
							await mutate(userKey(user.id), newTarget);

							const kind = (query.get("kind") || "love") as ProspectKind;
							if (ProspectKind.includes(kind))
								mutate(queueKey(kind), optimisticQueueMove("forward"));

							toasts.add(t("account_banned"));
							setOpen(false);
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
													<span
														data-mask
														className="text-lg font-semibold leading-none"
													>
														{displayName(user)}
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
										onClick={() => setOpen(false)}
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
}, {
	fallback: ({ children }) => children
});

export const SuspendAction: FC<{ user: User }> = ({ user }) => {
	return (
		<SuspendDialog user={user}>
			<DropdownMenuItem
				asChild
				className="text-red-500"
				disabled={!!user.bannedAt}
				onSelect={(event) => event.preventDefault()}
			>
				<button className="w-full gap-2" type="button">
					<Gavel className="size-5" />
					Ban
				</button>
			</DropdownMenuItem>
		</SuspendDialog>
	);
};
