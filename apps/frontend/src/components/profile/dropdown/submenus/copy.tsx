import { Clipboard } from "@capacitor/clipboard";
import {
	AtSign,
	CaseLower,
	CaseSensitive,
	Fingerprint,
	Link2,
	Share2
} from "lucide-react";
import type { FC, PropsWithChildren } from "react";

import { ConnectionMetadata, type ConnectionType } from "~/api/connections";
import { displayName, type User } from "~/api/user";
import {
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger
} from "~/components/dropdown";
import { useTranslations } from "~/hooks/use-internationalization";
import { useSession } from "~/hooks/use-session";
import { toAbsoluteUrl, urls } from "~/urls";

export const ProfileDropdownCopySubmenu: FC<
	PropsWithChildren<{ user: User }>
> = ({ user, children }) => {
	const [session] = useSession();
	const t = useTranslations();

	const connections: Array<{ type: ConnectionType; value: string | null }> = [
		{ type: "discord", value: user.profile.discord ?? null },
		{ type: "vrchat", value: user.profile.vrchat ?? null }
	];

	return (
		<DropdownMenuSub>
			{children}
			<DropdownMenuSubContent>
				<DropdownMenuLabel>{t("copy")}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2"
					onClick={() => Clipboard.write({ string: displayName(user) })}
				>
					<CaseSensitive className="size-5" />
					{t("display_name")}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => Clipboard.write({ string: user.slug })}
				>
					<CaseLower className="size-5" />
					{t("profile_link")}
				</DropdownMenuItem>
				{session?.user.tags?.includes("admin") && (
					<DropdownMenuItem
						className="gap-2"
						onClick={() => Clipboard.write({ string: user.email })}
					>
						<AtSign className="size-5" />
						{t("email_address")}
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2"
					onClick={() => Clipboard.write({ string: user.id })}
				>
					<Fingerprint className="size-5" />
					{t("user_id")}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-2"
					onClick={() => Clipboard.write({ string: user.talkjsId })}
				>
					<Fingerprint className="size-5" />
					{t("legacy_user_id")}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuSub>
					<DropdownMenuSubTrigger
						className="gap-2"
						disabled={connections.every(({ value }) => !value)}
					>
						<Share2 className="size-5" />
						{t("connection")}
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						{connections.map(({ type, value }) => {
							return (
								<DropdownMenuItem
									disabled={!value}
									key={type}
									onClick={() => value && Clipboard.write({ string: value })}
								>
									{t(type)}
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
						})}
				>
					<Link2 className="size-5" />
					{t("url")}
				</DropdownMenuItem>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};
