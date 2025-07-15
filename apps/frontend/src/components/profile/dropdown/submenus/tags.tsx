import type { FC, PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import { type User, userTagNames, userTags } from "~/api/user";
import {
	DropdownMenuCheckboxItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent
} from "~/components/dropdown";
import { useToast } from "~/hooks/use-toast";

export const ProfileDropdownTagsSubmenu: FC<
	PropsWithChildren<{ user: User }>
> = ({ user, children }) => {
	const toasts = useToast();
	const { t } = useTranslation();

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
								value: t("not_implemented")
							})}
					>
						{userTagNames[tag]}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};
