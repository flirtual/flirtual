import { MailWarning } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FC, useState } from "react";
import { mutate } from "swr";

import { displayName, User } from "~/api/user";
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
import { InputCheckbox, InputLabel, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import { useToast } from "~/hooks/use-toast";
import { userKey } from "~/swr";

export const WarnAction: FC<{ user: User }> = ({ user }) => {
	const router = useRouter();
	const toasts = useToast();

	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					asChild
					className="text-yellow-500"
					onSelect={(event) => event.preventDefault()}
				>
					<button className="w-full gap-2" type="button">
						<MailWarning className="size-5" />
						Warn
					</button>
				</DropdownMenuItem>
			</DialogTrigger>
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
								mutate(userKey(user.id));

								toasts.add("Account warning removed");
								setOpen(false);
								return;
							}

							await User.warn(targetId, { message, shadowban });
							mutate(userKey(user.id));

							toasts.add("Account warned");
							setOpen(false);
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
														data-sentry-mask
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
								<FormField name="message">
									{(field) => (
										<>
											<InputLabel {...field.labelProps}>Message</InputLabel>
											<InputTextArea autoFocus {...field.props} rows={6} />
										</>
									)}
								</FormField>
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
										{displayName(user)}
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
										onClick={() => setOpen(false)}
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
};
