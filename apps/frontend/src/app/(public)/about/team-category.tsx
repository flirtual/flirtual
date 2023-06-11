import { InlineLink } from "~/components/inline-link";

export interface TeamMember {
	name: string;
	role?: string;
	url: string;
}

export interface TeamCategory {
	name: string;
	members: Array<TeamMember>;
}

export const TeamCategory: React.FC<{ category: TeamCategory }> = ({
	category
}) => {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xl font-semibold">{category.name}</span>
			{category.members.map((member) => (
				<span key={member.name}>
					<InlineLink href={member.url}>{member.name}</InlineLink>
					{member.role && <span> - {member.role}</span>}
				</span>
			))}
		</div>
	);
};
