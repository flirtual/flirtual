import {
	ClipboardList,
	FileJson,
	Flag,
	Gem,
	MoreHorizontal,
	Shield,
	Tags,
	UserCircle2
} from "lucide-react";
import Link from "next/link";
import { FC } from "react";

import { User } from "~/api/user";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from "~/components/dropdown";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import { api } from "~/api";

import { ProfileDropdownCopySubmenu } from "./submenus/copy";
import { ProfileDropdownReportsSubmenu } from "./submenus/reports";
import { ProfileDropdownModerateSubmenu } from "./submenus/moderate";
import { ProfileDropdownTagsSubmenu } from "./submenus/tags";
import { ImpersonateAction } from "./actions/impersonate";

export interface ProfileDropdownProps {
	user: User;
}

export const ProfileDropdown: FC<ProfileDropdownProps> = ({ user }) => {
	const [session] = useSession();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="w-fit cursor-pointer outline-none" type="button">
					<span className="sr-only">Open menu</span>
					<MoreHorizontal className="h-6 w-6" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" sideOffset={8}>
				<ProfileDropdownCopySubmenu user={user}>
					<DropdownMenuSubTrigger className="gap-2">
						<ClipboardList className="h-5 w-5" />
						<span>Copy</span>
					</DropdownMenuSubTrigger>
				</ProfileDropdownCopySubmenu>
				<DropdownMenuSeparator />
				{session?.user.tags?.includes("moderator") && (
					<>
						<ProfileDropdownModerateSubmenu user={user}>
							<DropdownMenuSubTrigger
								className="gap-2"
								disabled={session.user.id === user.id}
							>
								<Shield className="h-5 w-5" />
								<span>Moderate</span>
							</DropdownMenuSubTrigger>
						</ProfileDropdownModerateSubmenu>
						<ProfileDropdownReportsSubmenu user={user}>
							<DropdownMenuSubTrigger className="gap-2">
								<Flag className="h-5 w-5" />
								<span>Reports</span>
							</DropdownMenuSubTrigger>
						</ProfileDropdownReportsSubmenu>
						<DropdownMenuSeparator />
					</>
				)}
				{session?.user.tags?.includes("admin") && (
					<>
						<ProfileDropdownTagsSubmenu user={user}>
							<DropdownMenuSubTrigger className="gap-2">
								<Tags className="h-5 w-5" />
								<span>Tags</span>
							</DropdownMenuSubTrigger>
						</ProfileDropdownTagsSubmenu>
						<ImpersonateAction user={user} />
						<DropdownMenuItem asChild disabled={!user.stripeId}>
							<Link
								className="gap-2"
								href={`https://dashboard.stripe.com/customers/${user.stripeId}`}
								target="_blank"
							>
								<Gem className="h-5 w-5" />
								View customer
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuItem asChild>
					<Link className="gap-2" href={urls.profile(user)}>
						<UserCircle2 className="h-5 w-5" />
						View profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link
						className="gap-2"
						href={api.newUrl(`users/${user.id}`)}
						target="_blank"
					>
						<FileJson className="h-5 w-5" />
						View raw object
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
