import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { Image } from "~/components/image";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";

export interface TeamMemberProps {
	name: string;
	role: string;
	avatar: string;
	url?: string;
	extra_url?: string;
}

export const TeamMember: React.FC<TeamMemberProps> = (props) => {
	const t = useTranslations("about.team");
	const { name, role, avatar, url, extra_url } = props;

	return (
		<div
			className={twMerge(
				"flex items-center gap-4 text-inherit",
				!url && "cursor-default"
			)}
		>
			<Image
				alt={t("image_alt", { name })}
				className="aspect-square w-12 shrink-0 rounded-full bg-black-70 object-cover shadow-brand-1"
				height="64"
				src={urls.media(avatar)}
				width="64"
			/>
			<div className="flex flex-col">
				<InlineLink
					href={url ?? "#"}
					className={twMerge(
						"font-montserrat text-lg font-semibold text-pink",
						!url && "cursor-default hocus:no-underline"
					)}
				>
					{name}
				</InlineLink>
				<span>
					{role}
					{extra_url && (
						<InlineLink className="text-pink" href={extra_url}>
							{" "}
							<ExternalLink className="inline size-4" />
						</InlineLink>
					)}
				</span>
			</div>
		</div>
	);
};
