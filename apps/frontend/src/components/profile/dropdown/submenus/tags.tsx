import type { FC, PropsWithChildren } from "react";

import { User, userTagNames, userTags } from "~/api/user";
import {
	DropdownMenuCheckboxItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent
} from "~/components/dropdown";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey, userKey } from "~/query";

export const ProfileDropdownTagsSubmenu: FC<
	PropsWithChildren<{ user: User }>
> = ({ user, children }) => {
	const session = useSession();
	const toasts = useToast();

	return (
		<DropdownMenuSub>
			{children}
			<DropdownMenuSubContent>
				<DropdownMenuLabel>Profile tags</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{userTags.map((tag) => {
					const active = user.tags?.includes(tag);
					return (
						<DropdownMenuCheckboxItem
							key={tag}
							checked={active}
							onCheckedChange={async () => {
								await (active
									? User.removeTag(user.id, tag)
									: User.addTag(user.id, tag)
								).catch(toasts.addError);

								await invalidate({ queryKey: userKey(user.id) });
								if (user.id === session.user.id)
									await invalidate({ queryKey: sessionKey() });
								toasts.add(`${active ? "Removed" : "Added"} ${userTagNames[tag]} tag`);
							}}
						>
							{userTagNames[tag]}
						</DropdownMenuCheckboxItem>
					);
				})}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};
