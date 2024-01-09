import { EyeOff, Scale, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, PropsWithChildren } from "react";

import { api } from "~/api";
import { User, displayName } from "~/api/user";
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
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

import { SuspendAction } from "./actions/suspend";
import { WarnAction } from "./actions/warn";

export const ProfileDropdownModerateSubmenu: FC<
	PropsWithChildren<{ user: User }>
> = ({ user, children }) => {
	const [session] = useSession();
	const router = useRouter();
	const toasts = useToast();

	return (
		<DropdownMenuSub>
			{children}
			<DropdownMenuSubContent>
				<DropdownMenuLabel>Moderate</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<SuspendAction user={user} />
				<WarnAction user={user} />
				{user.indefShadowbannedAt ? (
					<DropdownMenuItem
						asChild
						className="text-red-500"
						onClick={() => {
							api.user
								.unindefShadowban(user.id)
								.then(() => {
									toasts.add("User unshadowbanned");
									return router.refresh();
								})
								.catch(toasts.addError);
						}}
					>
						<button className="w-full gap-2" type="button">
							<EyeOff className="h-5 w-5" />
							Remove indef. shadowban
						</button>
					</DropdownMenuItem>
				) : (
					<DropdownMenuItem
						asChild
						className="text-red-500"
						onClick={() => {
							api.user
								.indefShadowban(user.id)
								.then(() => {
									toasts.add("User indefinitely shadowbanned");
									return router.refresh();
								})
								.catch(toasts.addError);
						}}
					>
						<button className="w-full gap-2" type="button">
							<EyeOff className="h-5 w-5" />
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
							onClick={() => {
								api.user
									.unsuspend(user.id)
									.then(() => {
										toasts.add("User unbanned");
										return router.refresh();
									})
									.catch(toasts.addError);
							}}
						>
							<button className="w-full gap-2" type="button">
								<Scale className="h-5 w-5" />
								Unban
							</button>
						</DropdownMenuItem>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<DropdownMenuItem
									className="w-full gap-2 text-red-500"
									onSelect={(event) => event.preventDefault()}
								>
									<Trash2 className="h-5 w-5" />
									Delete account
								</DropdownMenuItem>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								</AlertDialogHeader>
								<AlertDialogDescription>
									This action cannot be undone. This action will permanently
									delete the account{" "}
									<InlineLink href={urls.profile(user)}>
										{displayName(user)}
									</InlineLink>{" "}
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
												await api.user
													.adminDelete(user.id)
													.then(() => {
														toasts.add("User deleted");
														return router.refresh();
													})
													.catch(toasts.addError);
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
		</DropdownMenuSub>
	);
};
