import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FC, type PropsWithChildren, useState } from "react";

import { Report } from "~/api/report";
import { type User, displayName } from "~/api/user";
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
import { InputLabel, InputSelect, InputTextArea } from "~/components/inputs";
import { UserThumbnail } from "~/components/user-avatar";
import {
	useAttributeList,
	useAttributeTranslation
} from "~/hooks/use-attribute-list";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const ReportDialog: FC<PropsWithChildren<{ user: User }>> = ({
	user,
	children
}) => {
	const [session] = useSession();
	const t = useTranslations("profile.dialogs.report");
	const tAttributes = useAttributeTranslation();

	const router = useRouter();
	const toasts = useToast();

	const reasons = useAttributeList("report-reason");
	const defaultReason = reasons[0]!;

	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{children}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<Form
						className="flex flex-col gap-8"
						requireChange={false}
						fields={{
							targetId: user.id,
							reasonId:
								typeof defaultReason === "object"
									? defaultReason.id
									: defaultReason,
							message: "",
							images: [] as Array<ImageSetValue>
						}}
						onSubmit={async ({ reasonId, targetId, message, ...values }) => {
							if (!reasonId) return;
							await Report.create({
								reasonId,
								targetId,
								message,
								images: values.images.map((image) => image.id).filter(Boolean)
							});

							toasts.add(t("day_front_cat_cry"));
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
											<InputSelect
												{...field.props}
												options={reasons.map((reason) => {
													const id =
														typeof reason === "object" ? reason.id : reason;

													return {
														id,
														name: tAttributes[id]?.name || id
													};
												})}
											/>
										</>
									)}
								</FormField>
								<FormField name="message">
									{(field) => (
										<>
											<InputLabel {...field.labelProps}>
												{t("active_any_jannes_type")}
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
												hint={t("ok_gross_ostrich_work")}
											>
												{t("formal_nimble_dog_reside")}
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
