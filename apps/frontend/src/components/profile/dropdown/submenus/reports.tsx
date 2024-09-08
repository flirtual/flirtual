import { Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent
} from "~/components/dropdown";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";
import { Report } from "~/api/report";

import type { User } from "~/api/user";
import type { FC, PropsWithChildren } from "react";

export const ProfileDropdownReportsSubmenu: FC<
	PropsWithChildren<{ user: User }>
> = ({ user, children }) => {
	const [session] = useSession();

	const router = useRouter();
	const toasts = useToast();

	return (
		<DropdownMenuSub>
			{children}
			<DropdownMenuSubContent>
				<DropdownMenuLabel>Reports</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild disabled={session?.user.id === user.id}>
					<Link
						className="gap-2"
						href={urls.moderation.reports({ targetId: user.id })}
					>
						<Search className="size-5" />
						Created against user
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link
						className="gap-2"
						href={urls.moderation.reports({ userId: user.id })}
					>
						<Search className="size-5" />
						Created by user
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					asChild
					className="text-green-500"
					disabled={session?.user.id === user.id}
				>
					<button
						className="inline-flex w-full gap-2"
						type="button"
						onClick={async () => {
							await Report.clearAll(user.id)
								.then(({ count }) => {
									toasts.add(
										`Cleared ${count} report${count === 1 ? "" : "s"}`
									);
									return router.refresh();
								})
								.catch(toasts.addError);
						}}
					>
						<ShieldCheck className="size-5" />
						Clear all
					</button>
				</DropdownMenuItem>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};
