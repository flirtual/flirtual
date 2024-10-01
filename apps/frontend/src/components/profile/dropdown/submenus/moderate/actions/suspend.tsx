import { Gavel } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FC, useState } from "react";

import { User, displayName } from "~/api/user";
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
	useAttributeList,
	useAttributeTranslation
} from "~/hooks/use-attribute-list";
import { useToast } from "~/hooks/use-toast";

export const SuspendAction: FC<{ user: User }> = ({ user }) => {
	const router = useRouter();
	const toasts = useToast();

	const reasons = useAttributeList("ban-reason");
	const defaultReason = reasons[0]!;
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
						className="flex flex-col gap-8"
						requireChange={false}
						fields={{
							targetId: user.id,
							reasonId: defaultReason.id,
							message: tAttribute[defaultReason.id]!.details
						}}
						onSubmit={async ({ targetId, ...body }) => {
							await User.suspend(targetId, body);

							toasts.add("Account banned");
							router.refresh();

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
											options={reasons.map(({ id }) => ({
												id,
												name: tAttribute[id]?.name || id
											}))}
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
