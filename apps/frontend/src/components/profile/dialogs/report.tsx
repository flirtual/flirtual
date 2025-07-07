import { useTranslations } from "next-intl";
import { type FC, type PropsWithChildren, useState } from "react";

import type { ProspectKind } from "~/api/matchmaking";
import { Report } from "~/api/report";
import { displayName, type User } from "~/api/user";
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
import {
	type ImageSetValue,
	InputImageSet
} from "~/components/forms/input-image-set";
import { InputLabel, InputLabelHint, InputSelect, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import { useQueue } from "~/hooks/use-queue";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useSearchParams } from "~/i18n/navigation";
import { invalidate, userKey } from "~/query";

export const ReportDialog: FC<PropsWithChildren<{ user: User }>> = ({
	user,
	children
}) => {
	const session = useOptionalSession();
	const t = useTranslations();
	const tAttributes = useAttributeTranslation();

	const toasts = useToast();

	const query = useSearchParams();
	const kind = (query.get("kind") || "love") as ProspectKind;

	const { forward: forwardQueue } = useQueue(kind);

	const reasons = useAttributes("report-reason");
	const defaultReason = reasons[0]!;

	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{children}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("report_profile")}</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<Form
						fields={{
							targetId: user.id,
							reasonId:
								typeof defaultReason === "object"
									? defaultReason.id
									: defaultReason,
							message: "",
							images: [] as Array<ImageSetValue>
						}}
						className="flex flex-col gap-8"
						requireChange={false}
						onSubmit={async ({ reasonId, targetId, message, ...values }) => {
							if (!reasonId) return;

							await Report.create({
								reasonId,
								targetId,
								message,
								images: values.images.map((image) => image.id).filter(Boolean)
							});

							await invalidate({ queryKey: userKey(user.id) });
							await forwardQueue();

							toasts.add(t("day_front_cat_cry"));
							setOpen(false);
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
													data-mask
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
										<InputSelect
											{...field.props}
											options={reasons.map((reason) => {
												const id
													= typeof reason === "object" ? reason.id : reason;

												return {
													id,
													name: tAttributes[id]?.name || id
												};
											})}
										/>
									)}
								</FormField>
								<FormField name="message">
									{(field) => (
										<>
											<InputLabel {...field.labelProps}>
												{t("details")}
											</InputLabel>
											<InputTextArea
												{...field.props}
												placeholder={t("jolly_moving_stork_love")}
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
												hint={(
													<InputLabelHint className="vision:text-black-50">
														{t("ok_gross_ostrich_work")}
													</InputLabelHint>
												)}

											>
												{t("attachments")}
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
										{t("cancel")}
									</Button>
									<FormButton size="sm">{t("report")}</FormButton>
								</DialogFooter>
							</>
						)}
					</Form>
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};
