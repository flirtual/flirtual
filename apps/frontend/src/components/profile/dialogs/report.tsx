import { useState } from "react";
import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import { Report } from "~/api/report";
import type { User } from "~/api/user";
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

	InputImageSet
} from "~/components/forms/input-image-set";
import type { ImageSetValue } from "~/components/forms/input-image-set";
import { InputLabel, InputLabelHint, InputSelect, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import { invalidateMatch, useQueue } from "~/hooks/use-queue";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const ReportDialog: FC<PropsWithChildren<{ user: User }>> = ({
	user,
	children
}) => {
	const session = useOptionalSession();
	const { t } = useTranslation();
	const tAttributes = useAttributeTranslation();

	const toasts = useToast();

	const { removeAll: removeFromQueue } = useQueue();

	const reasons = useAttributes("report-reason");
	const defaultReason = reasons[0]!;

	const [open, setOpen] = useState(false);

	const detailsRequiredReasons = new Set([
		"AFe9ijRg9MYGubm2Efi4Ki",
		"Ec5fqqgVo5X3s4QCeFUJ6D",
		"MyexHAyY8gzQjBQ6agCSx3",
		"zu6HcxQxmJDDq4rmvJazkf",
		"BtJvp62cJ5vm6CeuCPTP5H",
		"9iwmQ8huhkngyY9BgLDE9W"
	]);

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

							await Promise.all([
								invalidateMatch(user.id),
								removeFromQueue(user.id)
							]);

							window.scrollTo({ top: 0, behavior: "smooth" });

							toasts.add(t("day_front_cat_cry"));
							setOpen(false);
						}}
					>
						{({ FormField, fields }) => {
							const detailsRequired = detailsRequiredReasons.has(fields.reasonId.props.value as string);

							return (
								<>
									<FormField name="targetId">
										{() => (
											<div className="flex items-center gap-4">
												<UserThumbnail user={user} />
												<div className="flex flex-col">
													<span className="text-lg font-semibold leading-none">
														{user.profile.displayName || t("unnamed_user")}
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
													placeholder={detailsRequired ? t("report_details_required_placeholder") : t("report_details_optional_placeholder")}
													required={detailsRequired}
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
							);
						}}
					</Form>
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};
