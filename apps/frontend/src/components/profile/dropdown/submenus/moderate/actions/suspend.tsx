import { Gavel } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { type FC, useState } from "react";
import { mutate } from "swr";

import { ProspectKind } from "~/api/matchmaking";
import { displayName, User } from "~/api/user";
import { optimisticQueueMove } from "~/app/(app)/(session)/(onboarded)/browse/queue-actions";
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
import { Form, FormButton } from "~/components/forms";
import { InputLabel, InputSelect, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import { useToast } from "~/hooks/use-toast";
import { queueKey, userKey } from "~/swr";

export const SuspendAction: FC<{ user: User }> = ({ user }) => {
	const toasts = useToast();
	const query = useSearchParams();

	const reasons = useAttributes("ban-reason");
	const defaultReason = reasons[0] as string;
	const tAttribute = useAttributeTranslation("ban-reason");

	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
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
						onSubmit={async ({ targetId, ...body }) => {
							await User.suspend(targetId, body);
							mutate(userKey(user.id));
							const kind = (query.get("kind") || "love") as ProspectKind;
							if (ProspectKind.includes(kind))
								mutate(queueKey(kind), optimisticQueueMove("forward"));

							toasts.add("Account banned");
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
													tAttribute[value]?.details || value
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
};
