import { Link, Pencil } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Session } from "~/api/auth";
import { User } from "~/api/user";
import { useSession } from "~/hooks/use-session";
import { useShare } from "~/hooks/use-share";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { mutate, sessionKey } from "~/query";
import { toAbsoluteUrl, urls } from "~/urls";

import { Button, ButtonLink } from "../button";
import { CopyClick } from "../copy-click";
import { DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog";
import { DrawerOrDialog } from "../drawer-or-dialog";
import { Form, FormButton } from "../forms";
import { ShareIcon } from "../icons/share";
import { InputText } from "../inputs";

export const PersonalActions: React.FC<{ user: User }> = ({ user }) => {
	const navigate = useNavigate();
	const session = useSession();
	const { t } = useTranslation();
	const toasts = useToast();
	const { share, canShare } = useShare();
	const [shareVisible, setShareVisible] = useState(false);
	const [profileLink, setProfileLink] = useState(session.user.slug);

	return (
		<div className="flex gap-4">
			<ButtonLink
				className="w-1/2 text-theme-overlay"
				href={urls.settings.bio}
				Icon={Pencil}
				size="sm"
			>
				{t("edit")}
			</ButtonLink>
			<DrawerOrDialog open={shareVisible} onOpenChange={setShareVisible}>
				<>
					<DialogHeader>
						<DialogTitle>{t("home_watery_koala_stop")}</DialogTitle>
					</DialogHeader>
					<DialogBody>
						<div className="flex min-h-48 flex-col justify-between gap-8 px-2 desktop:max-w-sm">
							<Form
								fields={{
									slug: profileLink
								}}
								className="flex flex-col gap-4"
								onSubmit={async ({ slug }) => {
									await User.update(user.id, {
										slug
									})
										.then(async (user) => {
											setProfileLink(slug);

											await mutate<Session>(sessionKey(), (session) => ({ ...session, user }));
											navigate(urls.profile(slug));

											return toasts.add(t("odd_mad_dog_nurture"));
										})
										.catch(toasts.addError);
								}}
							>
								{({ FormField }) => (
									<div className="flex flex-col gap-2">
										<div className="flex flex-row items-center gap-1">
											<FormField name="slug" className="w-full">
												{(field) => (
													<InputText
														{...field.props}
														startContent={(
															<span className="shrink-0 pl-4 font-mono">
																flirtu.al/
															</span>
														)}
														className="pl-0 font-mono"
														maxLength={20}
														minLength={3}
													/>
												)}
											</FormField>
										</div>
										<FormButton kind="secondary" size="sm">
											{t("update")}
										</FormButton>
									</div>
								)}
							</Form>
							<div className="flex w-full gap-2">
								{canShare && (
									<Button
										className="grow"
										Icon={ShareIcon}
										size="sm"
										onClick={async () => {
											await share({
												text: t("icy_stock_herring_burn"),
												url: toAbsoluteUrl(urls.profile(profileLink)).toString()
											}).catch((reason) => {
												if (reason instanceof Error && reason.name === "AbortError") return;
												toasts.addError(reason);
											});
										}}
									>
										{t("share")}
									</Button>
								)}
								<CopyClick
									value={toAbsoluteUrl(urls.profile(profileLink)).toString()}
								>
									<Button
										className="grow"
										Icon={Link}
										kind={canShare ? "secondary" : "primary"}
										size="sm"
									>
										{t("copy_link")}
									</Button>
								</CopyClick>
							</div>
						</div>
					</DialogBody>
				</>
			</DrawerOrDialog>
			<Button
				className="w-1/2 text-theme-overlay"
				Icon={ShareIcon}
				size="sm"
				onClick={() => setShareVisible(true)}
			>
				{t("share")}
			</Button>
		</div>
	);
};
