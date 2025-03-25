"use client";

import {
	CircleUserRound,
	ClipboardList,
	FileJson,
	Flag,
	Gem,
	Headset,
	Shield,
	ShieldEllipsis,
	Tags
} from "lucide-react";
import type { FC } from "react";

import { api } from "~/api/common";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from "~/components/dropdown";
import { Link } from "~/components/link";
import { useSession } from "~/hooks/use-session";
import { useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

import { ImpersonateAction } from "./actions/impersonate";
import { ProfileDropdownCopySubmenu } from "./submenus/copy";
import { ProfileDropdownModerateSubmenu } from "./submenus/moderate";
import { ProfileDropdownReportsSubmenu } from "./submenus/reports";
import { ProfileDropdownTagsSubmenu } from "./submenus/tags";

export interface ProfileDropdownProps {
	userId: string;
}

export const ProfileDropdown: FC<ProfileDropdownProps> = ({ userId }) => {
	const [session] = useSession();

	const user = useUser(userId);
	if (!user) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="w-fit cursor-pointer outline-none" type="button">
					<span className="sr-only">Open menu</span>
					<ShieldEllipsis className="size-5 vision:text-white-20" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" sideOffset={8}>
				<ProfileDropdownCopySubmenu user={user}>
					<DropdownMenuSubTrigger className="gap-2">
						<ClipboardList className="size-5" />
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
								<Shield className="size-5" />
								<span>Moderate</span>
							</DropdownMenuSubTrigger>
						</ProfileDropdownModerateSubmenu>
						<ProfileDropdownReportsSubmenu user={user}>
							<DropdownMenuSubTrigger className="gap-2">
								<Flag className="size-5" />
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
								<Tags className="size-5" />
								<span>Tags</span>
							</DropdownMenuSubTrigger>
						</ProfileDropdownTagsSubmenu>
						<ImpersonateAction user={user} />
						<DropdownMenuItem asChild>
							<Link
								className="gap-2"
								href={`https://hello.flirtu.al/a/search/customers?term=${user.email}`}
								target="_blank"
							>
								<Headset className="size-5" />
								Search helpdesk
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild disabled={!user.chargebeeId}>
							<Link
								className="gap-2"
								href={`https://flirtual.chargebee.com/d/customers/${user.chargebeeId}`}
								target="_blank"
							>
								<Gem className="size-5" />
								View Chargebee customer
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild disabled={!user.stripeId}>
							<Link
								className="gap-2"
								href={`https://dashboard.stripe.com/customers/${user.stripeId}`}
								target="_blank"
							>
								<Gem className="size-5" />
								View Stripe customer
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link
								className="gap-2"
								href={`https://app.revenuecat.com/customers/cf0649d1/${user.revenuecatId}`}
								target="_blank"
							>
								<Gem className="size-5" />
								View RevenueCat customer
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuItem asChild>
					<Link className="gap-2" href={urls.profile(user)}>
						<CircleUserRound className="size-5" />
						View profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link
						className="gap-2"
						href={api.url(`users/${user.id}`)._url}
						target="_blank"
					>
						<FileJson className="size-5" />
						View raw object
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
