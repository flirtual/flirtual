import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Image } from "~/components/image";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";

export interface TeamMemberProps {
	name: string;
	role: string;
	avatar: string;
	url?: string;
}

export const TeamMember: React.FC<TeamMemberProps> = (props) => {
	const { name, role, avatar, url } = props;

	const { t } = useTranslation();

	return (
		<div className="flex items-center gap-4 text-inherit">
			<Image
				alt={t("extra_moving_jackdaw_twist", { name })}
				className="aspect-square w-12 shrink-0 rounded-full bg-black-70 object-cover shadow-brand-1"
				height="64"
				src={urls.media(avatar)}
				width="64"
			/>
			<div className="flex flex-col">
				<span className="font-montserrat text-lg font-semibold">
					{name}
				</span>
				<span>
					{role}
					{url && (
						<InlineLink className="text-pink hocus:no-underline" href={url}>
							{" "}
							<ExternalLink className="inline size-4" />
						</InlineLink>
					)}
				</span>
			</div>
		</div>
	);
};
