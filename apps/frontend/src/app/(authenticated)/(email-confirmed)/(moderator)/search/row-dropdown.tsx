import { Clipboard } from "@capacitor/clipboard";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

import { User, displayName } from "~/api/user";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from "~/components/dropdown";
import { useSession } from "~/hooks/use-session";
import { toAbsoluteUrl, urls } from "~/urls";
import { lowercase } from "~/utilities";

export const RowDropdown: FC<{ user: User }> = ({ user }) => {
	const [session] = useSession();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div className="w-fit">
					<span className="sr-only">Open menu</span>
					<MoreHorizontal className="h-5 w-5" />
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<span>Copy</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuItem
							onClick={() => Clipboard.write({ string: displayName(user) })}
						>
							Display Name
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => Clipboard.write({ string: user.id })}
						>
							Username
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => Clipboard.write({ string: user.email })}
						>
							Email Address
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => Clipboard.write({ string: user.id })}
						>
							User ID
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => Clipboard.write({ string: user.talkjsId })}
						>
							Legacy User ID
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<span>Connection</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent>
								{(["Discord", "VRChat"] as const).map((connectionName) => {
									const key = lowercase(connectionName);
									const value = user.profile[key];

									return (
										<DropdownMenuItem
											disabled={!value}
											key={key}
											onClick={() =>
												value && Clipboard.write({ string: value })
											}
										>
											{connectionName}
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuSubContent>
						</DropdownMenuSub>
						<DropdownMenuItem
							onClick={() =>
								Clipboard.write({
									url: toAbsoluteUrl(urls.profile(user)).href
								})
							}
						>
							URL
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href={urls.profile(user)}>View profile</Link>
				</DropdownMenuItem>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<span>View reports</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuItem asChild>
							<Link href={urls.moderation.reports({ targetId: user.id })}>
								Against user
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href={urls.moderation.reports({ userId: user.id })}>
								By user
							</Link>
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				{session?.user.tags?.includes("admin") && (
					<DropdownMenuItem asChild disabled={!user.stripeId}>
						<Link
							href={`https://dashboard.stripe.com/customers/${user.stripeId}`}
							target="_blank"
						>
							View customer
						</Link>
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
