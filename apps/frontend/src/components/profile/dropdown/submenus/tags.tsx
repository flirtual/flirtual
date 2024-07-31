import { type User, userTagNames, userTags } from "~/api/user";
import {
	DropdownMenuCheckboxItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent
} from "~/components/dropdown";
import { useToast } from "~/hooks/use-toast";

import type { FC, PropsWithChildren } from "react";

export const ProfileDropdownTagsSubmenu: FC<
	PropsWithChildren<{ user: User }>
> = ({ user, children }) => {
	const toasts = useToast();

	return (
		<DropdownMenuSub>
			{children}
			<DropdownMenuSubContent>
				<DropdownMenuLabel>Profile tags</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{userTags.map((tag) => (
					<DropdownMenuCheckboxItem
						checked={user.tags?.includes(tag)}
						key={tag}
						onCheckedChange={() =>
							toasts.add({
								type: "error",
								value: "Not implemented"
							})
						}
					>
						{userTagNames[tag]}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};
