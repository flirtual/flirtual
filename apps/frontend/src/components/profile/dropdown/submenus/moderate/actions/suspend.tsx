import { queryOptions, useSuspenseQueries } from "@tanstack/react-query";
import { Gavel, Languages } from "lucide-react";
import { useMemo } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { withSuspense } from "with-suspense";

import { banReasonsOptions, byId, languagesOptions } from "~/api/data";
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
import { useDialog } from "~/hooks/use-dialog";
import { useQueue } from "~/hooks/use-queue";
import { useToast } from "~/hooks/use-toast";
import { defaultLocale, useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";
import { mutate, queryClient, userKey } from "~/query";

const SuspendDialog: FC<{ user: User; onClose: () => void }> = withSuspense(({ user, onClose }) => {
	const toasts = useToast();

	const [query] = useSearchParams();
	const kind = (query.get("kind") || "love") as ProspectKind;

	const { forward: forwardQueue } = useQueue(kind);

	const [locale] = useLocale();

	const languageNames = useMemo(
		() => new Intl.DisplayNames(intlLocale(locale), { type: "language" }),
		[locale]
	);

	const [{ data: reasons }, { data: languages }] = useSuspenseQueries({
		queries: [banReasonsOptions({ locale }), queryOptions({ ...languagesOptions({ locale }), select: byId })]
	});
	const reasonsById = byId(reasons);
	const defaultReason = reasons[0]?.id;
	const { t } = useTranslation();

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
					<DialogTitle>Ban profile</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<Form
						fields={{
							targetId: user.id,
							reasonId: defaultReason,
							message: (defaultReason && reasonsById[defaultReason]?.details) || ""
						}}
						className="flex flex-col gap-8"
						requireChange={false}
						onSubmit={async ({ targetId, reasonId, message }) => {
							const messageChanged = message !== reasonsById[reasonId]?.details;

							if (!messageChanged) {
								const targetLocale = user.preferences?.language ?? defaultLocale;
								const reasons = await queryClient.fetchQuery(banReasonsOptions({ locale: targetLocale }));

								message = reasons.find(({ id }) => id === reasonId)?.details || message;
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
			disabled={!!user.bannedAt || !!user.tags?.includes("review")}
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
