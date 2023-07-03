import { Clipboard } from "@capacitor/clipboard";
import {
	AtSign,
	CaseLower,
	CaseSensitive,
	Fingerprint,
	Link2,
	Share2
} from "lucide-react";
import { FC, PropsWithChildren } from "react";

import { ConnectionType, connectionTypeName } from "~/api/connections";
import { User, displayName } from "~/api/user";
import {
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger
} from "~/components/dropdown";
import { useSession } from "~/hooks/use-session";
import { toAbsoluteUrl, urls } from "~/urls";

export const ProfileDropdownCopySubmenu: FC<
	PropsWithChildren<{ user: User }>
> = ({ user, children }) => {
	const [session] = useSession();

	const connections: Array<{ type: ConnectionType; value: string | null }> = [
		{ type: "discord", value: user.profile.discord ?? null },
		{ type: "vrchat", value: user.profile.vrchat ?? null }
	];

	return (
		<DropdownMenuSub>
			{children}
			<DropdownMenuSubContent>
				<DropdownMenuLabel>Copy</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2"
					disabled={user.username === displayName(user)}
					onClick={() => Clipboard.write({ string: displayName(user) })}
				>
					<CaseSensitive className="h-5 w-5" />
					Display Name
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => Clipboard.write({ string: user.id })}
				>
					<CaseLower className="h-5 w-5" />
					Username
				</DropdownMenuItem>
				{session?.user.tags?.includes("admin") && (
					<DropdownMenuItem
						className="gap-2"
						onClick={() => Clipboard.write({ string: user.email })}
					>
						<AtSign className="h-5 w-5" />
						Email Address
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2"
					onClick={() => Clipboard.write({ string: user.id })}
				>
					<Fingerprint className="h-5 w-5" />
					User ID
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => Clipboard.write({ string: user.talkjsId })}
				>
					<Fingerprint className="h-5 w-5" />
					Legacy User ID
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuSub>
					<DropdownMenuSubTrigger
						className="gap-2"
						disabled={connections.every(({ value }) => !value)}
					>
						<Share2 className="h-5 w-5" />
						Connection
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						{connections.map(({ type, value }) => {
							return (
								<DropdownMenuItem
									disabled={!value}
									key={type}
									onClick={() => value && Clipboard.write({ string: value })}
								>
									{connectionTypeName[type]}
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuItem
					className="gap-2"
					onClick={() =>
						Clipboard.write({
							url: toAbsoluteUrl(urls.profile(user)).href
						})
					}
				>
					<Link2 className="h-5 w-5" />
					URL
				</DropdownMenuItem>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};
