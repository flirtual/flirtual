import { useRef } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

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
import { Form, FormButton } from "~/components/forms";
import { InputLabel, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, userKey } from "~/query";

export const ModeratorNoteDialog: FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
	const toasts = useToast();
	const { t } = useTranslation();
	const { user: { profile: { displayName: moderatorDisplayName } } } = useSession();
	const timestampAppended = useRef(false);
	const caretReference = useRef(0);

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
					<DialogTitle>Moderator note</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<Form
						fields={{
							targetId: user.id,
							message: user.moderatorNote || ""
						}}
						className="flex flex-col gap-8"
						requireChange={false}
						onSubmit={async ({ targetId, message }) => {
							if (!message && !!user.moderatorNote) {
								await User.deleteNote(targetId)
									.then(() => toasts.add(t("note_deleted")))
									.catch(toasts.addError);

								await invalidate({ queryKey: userKey(user.id) });
								onClose();
								return;
							}

							await User.note(targetId, { message: message.trim() })
								.then(() => toasts.add(t("note_updated")))
								.catch(toasts.addError);

							await invalidate({ queryKey: userKey(user.id) });
							onClose();
						}}
					>
						{({ FormField }) => (
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
								<FormField name="message">
									{(field) => (
										<>
											<InputLabel {...field.labelProps}>
												Note
											</InputLabel>
											<InputTextArea
												{...field.props}
												placeholder="Write a private moderator note about this user."
												rows={6}
												onChange={(value) => {
													if (!timestampAppended.current && value !== (user.moderatorNote || "")) {
														timestampAppended.current = true;
														const timestamp = `\n${new Date().toISOString().replace("T", " ").split(".")[0]} ${moderatorDisplayName}`;
														field.props.onChange(value + timestamp);

														requestAnimationFrame(() => {
															const textarea = document.activeElement as HTMLTextAreaElement;
															textarea.setSelectionRange(caretReference.current, caretReference.current);
														});
														return;
													}
													field.props.onChange(value);
												}}
												onInput={(event) => {
													const target = event.target as HTMLTextAreaElement;
													caretReference.current = target.selectionStart;
												}}
											/>
										</>
									)}
								</FormField>
								<DialogFooter>
									<Button
										kind="tertiary"
										size="sm"
										onClick={() => onClose()}
									>
										Cancel
									</Button>
									<FormButton size="sm">Save</FormButton>
								</DialogFooter>
							</>
						)}
					</Form>
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};
