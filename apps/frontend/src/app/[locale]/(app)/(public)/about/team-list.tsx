import { TeamMember } from "./team-member";
import type { TeamMemberProps } from "./team-member";

export interface TeamListProps {
	children: Array<TeamMemberProps>;
}

export const TeamList: React.FC<TeamListProps> = ({ children }) => {
	return (
		<div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
			{children.map((member) => (
				<TeamMember key={member.name} {...member} />
			))}
		</div>
	);
};
