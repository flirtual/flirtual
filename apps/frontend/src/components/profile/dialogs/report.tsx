import { useRouter } from "next/navigation";
import { FC, PropsWithChildren, useState } from "react";

import { api } from "~/api";
import { User, displayName } from "~/api/user";
import { Button } from "~/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { Form, FormButton } from "~/components/forms";
import {
	ImageSetValue,
	InputImageSet
} from "~/components/forms/input-image-set";
import { InputLabel, InputSelect, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const ReportDialog: FC<PropsWithChildren<{ user: User }>> = ({
	user,
	children
}) => {
	const [session] = useSession();
	const router = useRouter();
	const toasts = useToast();

	const reasons = useAttributeList("report-reason");
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{children}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Report profile</DialogTitle>
				</DialogHeader>
				<Form
					className="flex flex-col gap-8"
					requireChange={false}
					fields={{
						targetId: user.id,
						reasonId: reasons[0]?.id || null,
						message: "",
						images: [] as Array<ImageSetValue>
					}}
					onSubmit={async ({ reasonId, targetId, message, ...values }) => {
						if (!reasonId) return;
						await api.report.create({
							body: {
								reasonId,
								targetId,
								message,
								images: values.images.map((image) => image.id).filter(Boolean)
							}
						});

						toasts.add(
							"Thanks for keeping Flirtual safe! We'll review your report as soon as possible."
						);
						setOpen(false);

						return router.refresh();
					}}
				>
					{({ FormField }) => (
						<>
							<FormField name="targetId">
								{() => (
									<div className="flex items-center gap-4">
										<UserThumbnail user={user} />
										<div className="flex flex-col">
											<span
												data-sentry-mask
												className="text-lg font-semibold leading-none"
											>
												{displayName(user)}
											</span>
											{session?.user.tags?.includes("moderator") && (
												<span className="font-mono text-sm brightness-75">
													{user.id}
												</span>
											)}
										</div>
									</div>
								)}
							</FormField>
							<FormField name="reasonId">
								{(field) => (
									<>
										<InputSelect {...field.props} options={reasons} />
									</>
								)}
							</FormField>
							<FormField name="message">
								{(field) => (
									<>
										<InputLabel {...field.labelProps}>Details</InputLabel>
										<InputTextArea
											{...field.props}
											placeholder="Tell us a little more about this incident (optional)"
											rows={6}
										/>
									</>
								)}
							</FormField>
							<FormField name="images">
								{(field) => (
									<>
										<InputLabel
											{...field.labelProps}
											inline
											hint="Upload screenshots or other evidence (optional)"
										>
											Attachments
										</InputLabel>
										<InputImageSet type="report" {...field.props} />
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
								<FormButton size="sm">Report</FormButton>
							</DialogFooter>
						</>
					)}
				</Form>
			</DialogContent>
		</Dialog>
	);
};
