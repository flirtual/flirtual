"use client";

import { Check, Link, Pencil, X } from "lucide-react";
import { useDeferredValue, useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";

import { toAbsoluteUrl, urls } from "~/urls";
import { useShare } from "~/hooks/use-share";
import { useToast } from "~/hooks/use-toast";
import { useSession } from "~/hooks/use-session";
import { User } from "~/api/user";
import { useUserBySlug } from "~/hooks/use-user";

import { Button, ButtonLink } from "../button";
import { ShareIcon } from "../icons/share";
import { DrawerOrDialog } from "../drawer-or-dialog";
import { InputText } from "../inputs";
import { Form } from "../forms";
import { DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog";
import { CopyClick } from "../copy-click";

const Availability: FC<{ slug?: string }> = ({ slug }) => {
	const t = useTranslations("profile");
	const deferredSlug = useDeferredValue(slug);
	const exists = !useUserBySlug(deferredSlug || "");

	const Icon = exists ? Check : X;

	return (
		<div className="flex shrink-0 items-center gap-2 pr-4">
			<span>{exists ? t("available") : t("unavailable")}</span>

			<Icon
				className={twMerge(
					"size-6",
					exists ? "text-green-400" : "text-red-400"
				)}
			/>
		</div>
	);
};

export const PersonalActions: React.FC<{ user: User }> = ({ user }) => {
	const [session] = useSession();
	const t = useTranslations("profile");
	const toasts = useToast();
	const router = useRouter();
	const { share, canShare } = useShare();
	const [shareVisible, setShareVisible] = useState(false);
	const [slug, setSlug] = useState(session?.user.slug);

	if (!session) return null;

	return (
		<div className="grid grid-cols-2 gap-4">
			<ButtonLink
				className="text-theme-overlay"
				href={urls.settings.bio}
				Icon={Pencil}
				size="sm"
			>
				{t("crazy_large_hound_grace")}
			</ButtonLink>
			<Form
				fields={{
					slug
				}}
				onSubmit={async ({ slug }) => {
					await User.update(user.id, {
						slug
					}).then(() => {
						setSlug(slug);
						return toasts.add(t("odd_mad_dog_nurture"));
					});
				}}
			>
				{({ FormField, changes, submit }) => (
					<>
						<Button
							className="w-full text-theme-overlay"
							Icon={ShareIcon}
							size="sm"
							onClick={() => setShareVisible(true)}
						>
							{t("spare_short_tapir_dream")}
						</Button>
						<DrawerOrDialog
							open={shareVisible}
							onOpenChange={async (visible) => {
								if (changes.includes("slug")) {
									const {
										fieldErrors: { slug }
									} = await submit();

									if (slug?.length) return;
									router.push(urls.user.me);
								}

								setShareVisible(visible);
							}}
						>
							<>
								<DialogHeader>
									<DialogTitle>{t("home_watery_koala_stop")}</DialogTitle>
								</DialogHeader>
								<DialogBody>
									<div className="flex min-h-32 flex-col justify-between gap-8 px-2 desktop:max-w-sm">
										<div className="flex flex-col gap-2">
											<FormField className="w-full" name="slug">
												{(field) => (
													<InputText
														{...field.props}
														startContent={
															<span className="shrink-0 pl-4 font-mono">
																flirtu.al/
															</span>
														}
														endContent={
															field.changed && (
																<Availability slug={field.props.value} />
															)
														}
														className="pl-0 font-mono"
													/>
												)}
											</FormField>
											{/* <FormButton kind="secondary" size="sm">
												{t("sleek_simple_puma_find")}
											</FormButton> */}
										</div>
										<div className="grid grid-cols-2 gap-2">
											{canShare && (
												<Button
													Icon={ShareIcon}
													size="sm"
													onClick={async () => {
														await share({
															text: t("icy_stock_herring_burn"),
															url: toAbsoluteUrl(urls.profile(slug)).toString()
														}).catch(toasts.addError);
													}}
												>
													{t("spare_short_tapir_dream")}
												</Button>
											)}
											<CopyClick
												value={toAbsoluteUrl(urls.profile(slug)).toString()}
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
					</>
				)}
			</Form>
		</div>
	);
};
