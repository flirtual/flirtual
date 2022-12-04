export interface NavigationCategoryProps {
	name: string;
	children: React.ReactNode;
}

export const NavigationCategory: React.FC<NavigationCategoryProps> = ({ children, name }) => (
	<div className="flex flex-col gap-4">
		<h1 className="flex flex-col px-6 font-montserrat font-semibold">{name}</h1>
		<div className="flex flex-col">{children}</div>
	</div>
);
