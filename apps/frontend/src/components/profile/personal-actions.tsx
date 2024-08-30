"use client";

import { Link, Pencil } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { toAbsoluteUrl, urls } from "~/urls";
import { useShare } from "~/hooks/use-share";
import { api } from "~/api";
import { useToast } from "~/hooks/use-toast";
import { useSession } from "~/hooks/use-session";

import { Button, ButtonLink } from "../button";
import { ShareIcon } from "../icons/share";
import { DrawerOrDialog } from "../drawer-or-dialog";
import { InputText } from "../inputs";
import { Form, FormButton } from "../forms";
import { DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog";
import { CopyClick } from "../copy-click";

import type { User } from "~/api/user";

export const PersonalActions: React.FC<{ user: User }> = ({ user }) => {
	const [session] = useSession();
	const t = useTranslations("profile");
	const toasts = useToast();
	const { share, canShare } = useShare();
	const [shareVisible, setShareVisible] = useState(false);
	const [profileLink, setProfileLink] = useState(session?.user.slug);

	if (!session) return null;

	return (
		<div className="flex gap-4">
			<ButtonLink
				className="w-1/2 text-theme-overlay"
				href={urls.settings.bio}
				Icon={Pencil}
				size="sm"
			>
				{t("crazy_large_hound_grace")}
			</ButtonLink>
			<DrawerOrDialog open={shareVisible} onOpenChange={setShareVisible}>
				<>
					<DialogHeader>
						<DialogTitle>{t("home_watery_koala_stop")}</DialogTitle>
					</DialogHeader>
					<DialogBody>
						<div className="flex min-h-48 flex-col justify-between gap-8 px-2 desktop:max-w-sm">
							<Form
								className="flex flex-col gap-4"
								fields={{
									link: profileLink
								}}
								onSubmit={async ({ link }) => {
									await api.user
										.update(user.id, {
											body: { slug: link }
										})
										.then(() => {
											setProfileLink(link);
											return toasts.add(t("odd_mad_dog_nurture"));
										})
										.catch((reason) =>
											toasts.add({
												type: "error",
												value: reason.message.replace("Slug", "Profile link")
											})
										);
								}}
							>
								{({ FormField }) => (
									<div className="flex flex-col gap-2">
										<div className="flex flex-row items-center gap-1">
											<span className="shrink-0 font-mono">flirtu.al/</span>
											<FormField className="w-full" name="link">
												{(field) => (
													<InputText
														{...field.props}
														className="px-2 py-1 font-mono"
														maxLength={20}
														minLength={3}
													/>
												)}
											</FormField>
										</div>
										<FormButton kind="secondary" size="sm">
											{t("sleek_simple_puma_find")}
										</FormButton>
									</div>
								)}
							</Form>
							<div className="grid grid-cols-2 gap-2">
								{canShare && (
									<Button
										Icon={ShareIcon}
										size="sm"
										onClick={async () => {
											await share({
												text: t("icy_stock_herring_burn"),
												url: toAbsoluteUrl(urls.profile(profileLink)).toString()
											}).catch(toasts.addError);
										}}
									>
										{t("spare_short_tapir_dream")}
									</Button>
								)}
								<CopyClick
									value={toAbsoluteUrl(urls.profile(profileLink)).toString()}
								>
									<Button
										Icon={Link}
										kind={canShare ? "secondary" : "primary"}
										size="sm"
									>
										{t("mealy_any_javelina_hint")}
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
				{t("spare_short_tapir_dream")}
			</Button>
		</div>
	);
};
