import { twMerge } from "tailwind-merge";

import { IconComponent } from "~/components/icons";

export interface ConnectionButtonProps {
	children: string;
	accountName?: string;
	Icon: IconComponent;
	iconClassName?: string;
}

export const ConnectionButton: React.FC<ConnectionButtonProps> = (props) => {
	const { children, accountName, iconClassName, Icon } = props;

	return (
		<button
			className="flex w-full cursor-pointer overflow-hidden rounded-xl bg-white-40 text-left shadow-brand-1 focus-within:ring-2 focus-within:ring-coral focus-within:ring-offset-2 focus:outline-none dark:bg-black-60 dark:text-white-20 focus-within:dark:ring-offset-black-50"
			type="button"
		>
			<div
				className={twMerge(
					"flex aspect-square h-12 w-12 items-center justify-center p-2 text-white-20",
					iconClassName
				)}
			>
				<Icon className="h-7 w-7" />
			</div>
			<div className="flex flex-col px-4 py-2 font-nunito leading-none">
				<span>{children}</span>
				<span className="text-sm leading-none text-black-60">
					{accountName ?? "Connect account"}
				</span>
			</div>
		</button>
	);
};
