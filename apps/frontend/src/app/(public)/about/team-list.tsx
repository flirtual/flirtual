import { TeamCategory } from "./team-category";

export interface TeamListProps {
	children: Array<TeamCategory>;
}

export const TeamList: React.FC<TeamListProps> = ({ children }) => {
	return (
		<div className="flex flex-col gap-4">
			{children.map((category) => (
				<TeamCategory category={category} key={category.name} />
			))}
		</div>
	);
};
