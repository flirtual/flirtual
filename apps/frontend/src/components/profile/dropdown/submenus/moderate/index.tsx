import { CreditCard, EyeOff, Scale, Trash2 } from "lucide-react";
import { type FC, type PropsWithChildren, Suspense } from "react";
import { useTranslation } from "react-i18next";

import { displayName, User } from "~/api/user";
import { Button } from "~/components/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from "~/components/dialog/alert";
import { DialogFooter } from "~/components/dialog/dialog";
import {
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent
} from "~/components/dropdown";
import { InlineLink } from "~/components/inline-link";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, userKey } from "~/query";
import { urls } from "~/urls";

import { SuspendAction } from "./actions/suspend";
import { WarnAction } from "./actions/warn";

export const ProfileDropdownModerateSubmenu: FC<
	PropsWithChildren<{ user: User }>
> = ({ user, children }) => {
	const session = useOptionalSession();
	const toasts = useToast();
	const { t } = useTranslation();

	return (
		<DropdownMenuSub>
			{children}
			<Suspense>
				<DropdownMenuSubContent>
					<DropdownMenuLabel>Moderate</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<SuspendAction user={user} />
					<WarnAction user={user} />
					{user.indefShadowbannedAt
						? (
								<DropdownMenuItem
									asChild
									className="text-red-500"
									onClick={async () => {
										await User.unindefShadowban(user.id)
											.then(() => toasts.add(t("user_unshadowbanned")))
											.catch(toasts.addError);

										await invalidate({ queryKey: userKey(user.id) });
									}}
								>
									<button className="w-full gap-2" type="button">
										<EyeOff className="size-5" />
										Remove indef. shadowban
									</button>
								</DropdownMenuItem>
							)
						: (
								<DropdownMenuItem
									asChild
									className="text-red-500"
									onClick={async () => {
										await User.indefShadowban(user.id)
											.then(() => toasts.add(t("user_indefinitely_shadowbanned")))
											.catch(toasts.addError);

										await invalidate({ queryKey: userKey(user.id) });
									}}
								>
									<button className="w-full gap-2" type="button">
										<EyeOff className="size-5" />
										Indef. shadowban
									</button>
								</DropdownMenuItem>
							)}
					{session?.user.tags?.includes("admin") && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								asChild
								className="text-green-500"
								disabled={!user.bannedAt}
								onClick={async () => {
									await User.unsuspend(user.id)
										.then(() => toasts.add(t("user_unbanned")))
										.catch(toasts.addError);

									await invalidate({ queryKey: userKey(user.id) });
								}}
							>
								<button className="w-full gap-2" type="button">
									<Scale className="size-5" />
									Unban
								</button>
							</DropdownMenuItem>
							{user.paymentsBannedAt
								? (
										<DropdownMenuItem
											asChild
											className="text-red-500"
											onClick={async () => {
												await User.paymentsUnban(user.id)
													.then(() => toasts.add(t("user_payments_unbanned")))
													.catch(toasts.addError);

												await invalidate({ queryKey: userKey(user.id) });
											}}
										>
											<button className="w-full gap-2" type="button">
												<CreditCard className="size-5" />
												Remove payments ban
											</button>
										</DropdownMenuItem>
									)
								: (
										<DropdownMenuItem
											asChild
											className="text-red-500"
											onClick={async () => {
												await User.paymentsBan(user.id)
													.then(() => toasts.add(t("user_payments_banned")))
													.catch(toasts.addError);

												await invalidate({ queryKey: userKey(user.id) });
											}}
										>
											<button className="w-full gap-2" type="button">
												<CreditCard className="size-5" />
												Payments ban
											</button>
										</DropdownMenuItem>
									)}
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<DropdownMenuItem
										className="w-full gap-2 text-red-500"
										onSelect={(event) => event.preventDefault()}
									>
										<Trash2 className="size-5" />
										Delete account
									</DropdownMenuItem>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
									</AlertDialogHeader>
									<AlertDialogDescription>
										This action cannot be undone. This action will permanently
										delete the account
										{" "}
										<InlineLink href={urls.profile(user)}>
											{displayName(user)}
										</InlineLink>
										{" "}
										and it will be unrecoverable.
									</AlertDialogDescription>
									<DialogFooter>
										<AlertDialogCancel asChild>
											<Button kind="tertiary" size="sm">
												Cancel
											</Button>
										</AlertDialogCancel>
										<AlertDialogAction asChild>
											<Button
												size="sm"
												onClick={async () => {
													await User.delete(user.id).catch(toasts.addError);
													toasts.add(t("user_deleted"));
												}}
											>
												Delete account
											</Button>
										</AlertDialogAction>
									</DialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</>
					)}
				</DropdownMenuSubContent>
			</Suspense>
		</DropdownMenuSub>
	);
};
